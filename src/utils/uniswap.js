/*
Author: Jake Mathai
Purpose: Uniswap client
*/

const { Op } = require('sequelize')

const db = require('../db/client')
const time = require('../utils/time')
const { TheGraphClient } = require('../utils/thegraph')

const UniswapClient = () => {
    const thegraph = TheGraphClient()

    // Query subgraph for all pair contract addresses for the target token
    const getAllTokenPairs = async targetTokenAddress => {
        let queries = []
        for (let skip = 0; skip < 6000; skip += 1000)
            queries.push(thegraph.querySubgraph('UniswapV2', 'Pair', `first: 1000, skip: ${skip}, where: {token0: "${targetTokenAddress}"}`)) 
        for (let skip = 0; skip < 6000; skip += 1000)
            queries.push(thegraph.querySubgraph('UniswapV2', 'Pair', `first: 1000, skip: ${skip}, where: {token1: "${targetTokenAddress}"}`)) 
        const results = await Promise.all(queries)
        return [].concat.apply([], results);
    }

    const getETHPrice = async() => parseFloat((await thegraph.querySubgraph('UniswapV2', 'Bundle', 'where: {id: "1"}'))[0]['ethPrice'])

    // Filter for token observations in window
    const getObservationsInWindow = async(tokenAddress, fromDate=null, toDate=time.now()) => {
        if (typeof toDate == 'string')  // Coerce fromDate and toDate to datetime objects. If fromDate is null, assume 24h window before toDate
            toDate = new Date(toDate)
        if (typeof fromDate == 'string')
            fromDate = new Date(fromDate)
        const toDateUnix = time.datetimeToUnix(toDate)
        if (fromDate == null)
            fromDate = time.unixToDatetime(toDateUnix - (60*60*24))
        return await db.TokenObservation.findAll({  // Find observations in window
            'where': {
                'address': tokenAddress,
                'datestamp': {
                    [Op.between] : [fromDate, toDate]
                }
            },
            'raw': true
        })
    }

    // Notional USD token volume in window. Calculated as the change in total volume over the window multiplied by the volume-weighted average price over the period
    const calculateTokenVolume = observations => {
        if (observations == null || observations.length < 2)
            return 0
        const latestTokenVolume = parseFloat(observations[observations.length - 1]['totalTokenVolume'])
        const earliestTokenVolume = parseFloat(observations[0]['totalTokenVolume'])
        const totalTokenVolume = latestTokenVolume - earliestTokenVolume
        let volumeWeightedAveragePrice = 0
        for (let i = 1; i < observations.length; ++i) {
            const tokenVolume = parseFloat(observations[i]['totalTokenVolume']) - parseFloat(observations[i - 1]['totalTokenVolume'])
            volumeWeightedAveragePrice += parseFloat(observations[i]['price']) * tokenVolume / totalTokenVolume
        }
        return totalTokenVolume * volumeWeightedAveragePrice
    }

    // Get uniswap trading volume for a token denominated in USD
    const getTokenVolume = async(tokenAddress, fromDate=null, toDate=time.now()) => {
        const observations = await getObservationsInWindow(tokenAddress, fromDate, toDate)
        return calculateTokenVolume(observations)
    }

    // Notional USD token liquidity in window. Calculated as the mean liquidity level of the token over the period multiplied by the average price over the period
    const calculateTokenLiquidity = observations => {
        if (observations == null || observations.length < 2)
            return null
        const prices = observations.map(observation => parseFloat(observation['price']))
        const tokenLiquidities = observations.map(observation => parseFloat(observation['totalTokenLiquidity']))
        const meanPrice = prices.reduce((a, b) => a + b, 0.0) / observations.length
        const meanTokenLiquidity = tokenLiquidities.reduce((a, b) => a + b, 0.0) / observations.length
        return meanTokenLiquidity * meanPrice
    }

    // Get aggregate token liquidity for a token denominated in USD
    const getTokenLiquidity = async(tokenAddress, fromDate=null, toDate=time.now()) => {
        const observations = await getObservationsInWindow(tokenAddress, fromDate, toDate)
        return calculateTokenLiquidity(observations)
    }

    // Run liquidity and volume calcs on a single DB query
    const getTokenLiquidityAndVolume = async(tokenAddress, fromDate=null, toDate=time.now()) => {
        const observations = await getObservationsInWindow(tokenAddress, fromDate, toDate)
        return [calculateTokenLiquidity(observations), calculateTokenVolume(observations)]
    }

    const subscribeToToken = (tokenAddress, interval=1000) => thegraph.watchQuery('UniswapV2', 'Token', `first: 1, where: {id: "${tokenAddress}"}`, interval)

    return {
        getAllTokenPairs,
        getETHPrice,
        getTokenVolume,
        getTokenLiquidity,
        getTokenLiquidityAndVolume,
        subscribeToToken
    }
}

module.exports = {
    UniswapClient
}
