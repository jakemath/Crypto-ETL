/*
Author: Jake Mathai
Purpose: EVM bytecode decompiler
*/

const { EVM } = require('evm')

let opcodes = require('../data/opcodes.json')

const toOpcode = bytecode => {
    let instructions = []
    for (let i = 2; i < bytecode.length - 1; i += 2) {
        const code = `0x${bytecode.slice(i, i + 2)}`
        const instructionInfo = opcodes[code]
        if (instructionInfo == null) {
            instructions.push(`0x${code}`)
            continue
        }
        let instruction = instructionInfo['name']
        const operands = instructionInfo['args']
        if (operands != null && !isNaN(operands) && operands > 0) {
            const operandsEndIndex = i + 2 + (2*operands)
            instruction += ' 0x' + bytecode.slice(i + 2, operandsEndIndex)
            i = operandsEndIndex - 2
        }
        instructions.push(instruction)
    }
    return instructions
}

const toBytecode = opcodeList => {
    let bytecode = ''
    for (const opcode of opcodeList) {
        if (opcode.slice(0, 4) == 'PUSH') {
            const splitOpcode = opcode.split(' ')
            bytecode += (opcodes[splitOpcode[0]] || {})['name'] || splitOpcode[0]
            bytecode += splitOpcode[1] || ''
        }
        else {
            bytecode += (opcodes[opcode] || {})['name'] || opcode
        }
    }
    return '0x' + bytecode.replace('0x', '')
}

const test = () => {
    const sample = '0x606060405236156100da5760e060020a6000350463016b94b4811461035b5780630911e24d1461037c5780631d007f5f146103a35780632825b231146103c45780633052c493146104205780633ccfd60b146104415780633cebb8231461045f57806347174efb14610480578063528f0dfd146104a15780635353c11d146104c857806373837c831461052657806377a8a2191461058457806377c00de0146105e6578063812d6c4014610604578063a2c0da8d14610625578063a9059cbb1461068f578063c2147c58146106b3578063c9d27afe146106d4575b6106f86000805460ff16156102ec57600b547f70a08231000000000000000000000000000000000000000000000000000000006060908152600160a060020a03308116606452909116906370a082319060849060209060248187876161da5a03f11561000257505060405151600554600a54919350901015905061025857600a8054600101905560005462010000900460ff16156101fb57600b60009054906101000a9004600160a060020a0316600160a060020a031663a9059cbb600360009054906101000a9004600160a060020a031660646006600050548502046040518360e060020a0281526004018083600160a060020a03168152602001828152602001925050506020604051808303816000876161da5a03f115610002575050505b60408051600b546004805460015460e260020a632099877102855291840152600160a060020a03908116602484015292519216916382661dc49160448181019260209290919082900301816000876161da5a03f115610002575050505b6000600a81905554610100900460ff16156102ec57600b60009054906101000a9004600160a060020a0316600160a060020a031663a9059cbb600360009054906101000a9004600160a060020a0316836040518360e060020a0281526004018083600160a060020a03168152602001828152602001925050506020604051808303816000876161da5a03f115610002575050505b60075460ff161561075c57600760019054906101000a9004600160a060020a0316600160a060020a0316600860005054600960005060405180828054600181600116156101000203166002900480156107415780601f106106fa57610100808354040283529160200191610741565b6106f860043560025433600160a060020a0390811691161461082b57610002565b6106f860043560243560443560025433600160a060020a0390811691161461075f57610002565b6106f860043560025433600160a060020a03908116911614610b7257610002565b60206004803580820135601f8101849004909302608090810160405260608481526106f894602493919291840191819083828082843750949650505050505050600254600160a060020a03908116339091161461096b57610002565b6106f860043560025433600160a060020a03908116911614610b5357610002565b6106f860025433600160a060020a0390811691161461094557610002565b6106f860043560025433600160a060020a03908116911614610b5d57610002565b6106f860043560025433600160a060020a0390811691161461078557610002565b6106f860043560243560443560025433600160a060020a039081169116146107ac57610002565b60206004803580820135601f8101849004909302608090810160405260608481526106f8946024939192918401918190838280828437509496505093359350505050600254600160a060020a039081163390911614610a5c57610002565b60206004803580820135601f8101849004909302608090810160405260608481526106f8946024939192918401918190838280828437509496505093359350505050600254600160a060020a0390811633909116146109e357610002565b60206004803580820135601f8101849004909302608090810160405260608481526106f894602493919291840191819083828082843750949650509335935050604435915050600254600160a060020a039081163390911614610ad857610002565b6106f860025433600160a060020a039081169116146107d857610002565b6106f860043560025433600160a060020a03908116911614610bc357610002565b60806020606435600481810135601f8101849004909302840160405260608381526106f8948235946024803595604435959460849490939190920191819083828082843750949650505050505050600254600160a060020a039081163390911614610bc857610002565b6106f860043560243560025433600160a060020a039081169116146108e157610002565b6106f860043560025433600160a060020a0390811691161461079457610002565b6106f860043560243560025433600160a060020a0390811691161461087e57610002565b005b600091909152017f6e1540171b6c0c960b71a7020d9f60077f6af931a8bbf590da0223dacf75c7af825b81548152906001019060200180831161072457829003601f168201915b505091505060006040518083038185876185025a03f1505050505b50565b6000805460ff191690931790925560045560018054600160a060020a0319169091179055565b6000805460ff19168217905550565b6000805462010000830262ff00001990911617905550565b6000805462010000840260ff19918216861762ff00001916179091556007805490911682179055505050565b600b5460045460015460e260020a6320998771026060908152606492909252600160a060020a03908116608452909116906382661dc49060a4906020906044816000876161da5a03f11561000257505050565b600b5460045460015460e260020a6320998771026060908152606492909252600160a060020a03908116608452909116906382661dc490839060a49060209060448160008887f115610002575050505050565b600b547fc9d27afe00000000000000000000000000000000000000000000000000000000606090815260648490526084839052600160a060020a039091169063c9d27afe9060a4906020906044816000876161da5a03f115610002575050505050565b600b547fa9059cbb000000000000000000000000000000000000000000000000000000006060908152600160a060020a0384811660645260848490529091169063a9059cbb9060a4906020906044816000876161da5a03f115610002575050505050565b600254600160a060020a0390811690600090301631606082818181858883f15050505050565b604051600b548251600160a060020a039190911691839181906080908083818460006004600f6020601f86010402600301f150905090810190601f1680156109c75780820380516001836020036101000a031916815260200191505b509150506000604051808303816000866161da5a03f150505050565b604051600b548351600160a060020a039190911691839185919081906080908083818460006004600f6020601f86010402600301f150905090810190601f168015610a425780820380516001836020036101000a031916815260200191505b5091505060006040518083038160008787f1505050505050565b604051600b548351600160a060020a039190911691839185919081906080908083818460006004600f6020601f86010402600301f150905090810190601f168015610abb5780820380516001836020036101000a031916815260200191505b5091505060006040518083038185876185025a03f1505050505050565b604051600b548451600160a060020a03919091169184918491879181906080908083818460006004600f6020601f86010402600301f150905090810190601f168015610b385780820380516001836020036101000a031916815260200191505b50915050600060405180830381858888f15050505050505050565b6000600a55600555565b60028054600160a060020a0319168217905550565b60008054630100000080840276ffffffffffffffffffffffffffffffffffffffff000000199092169190911791829055600b8054600160a060020a03191691909204600160a060020a031617905550565b600655565b6007805460ff1916851774ffffffffffffffffffffffffffffffffffffffff001916610100858102919091179091556008839055815160098054600082905290926020600260018416159092026000190190921604601f908101919091047f6e1540171b6c0c960b71a7020d9f60077f6af931a8bbf590da0223dacf75c7af9081019291608090839010610c7f57805160ff19168380011785555b50610caf9291505b80821115610cb75760008155600101610c6b565b82800160010185558215610c63579182015b82811115610c63578251826000505591602001919060010190610c91565b505050505050565b509056'
    console.time('toOpcode')
    const instructions = toOpcode(sample)
    console.timeEnd('toOpcode')
    const rawInstructions = instructions.map(x => x.split(' ')[0]).join('')
    const evm = new EVM(sample)
    console.log(evm.getOpcodes().map(x => x['name']).join('') == rawInstructions)
    console.time('toBytecode')
    const bytecode = toBytecode(sample)
    console.timeEnd('toBytecode')
    console.log(bytecode == sample)
    return null
}

module.exports = {
    toOpcode,
    toBytecode,
    test
}
