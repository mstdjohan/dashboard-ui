const Web3 = require("web3");
const { ethers } = require("ethers");
require("dotenv").config();

const RPC_URL = "https://bsc-dataseed.binance.org/";
const web3 = new Web3(RPC_URL);
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const account = wallet.address;

const ROUTER_ABI = require("./abis/router.json");
const ERC20_ABI = require("./abis/erc20.json");

// Konfigurasi
const CAKE = "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82";
const BUSD = "0xe9e7cea3dedca5984780bafc599bd69add087d56";
const ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E";

const tradeAmount = ethers.utils.parseUnits("10", 18); // 10 BUSD
const slippage = 0.01; // 1%

async function approveToken(token, spender, amount) {
    const contract = new ethers.Contract(token, ERC20_ABI, wallet);
    const allowance = await contract.allowance(account, spender);
    if (allowance.lt(amount)) {
        console.log("🔐 Approving token...");
        const tx = await contract.approve(spender, amount);
        await tx.wait();
        console.log("✅ Approved.");
    } else {
        console.log("✅ Token already approved.");
    }
}

async function swapBUSDtoCAKE() {
    const router = new ethers.Contract(ROUTER, ROUTER_ABI, wallet);
    const amounts = await router.getAmountsOut(tradeAmount, [BUSD, CAKE]);
    const minOut = amounts[1].sub(amounts[1].mul(slippage * 100).div(10000));

    await approveToken(BUSD, ROUTER, tradeAmount);

    console.log("🔄 Swapping BUSD to CAKE...");
    const tx = await router.swapExactTokensForTokens(
        tradeAmount,
        minOut,
        [BUSD, CAKE],
        account,
        Math.floor(Date.now() / 1000) + 60 * 5,
        { gasLimit: 300000 }
    );
    const receipt = await tx.wait();
    console.log("✅ Swap success:", receipt.transactionHash);
}

async function main() {
    await swapBUSDtoCAKE();
}

main().catch(console.error);
