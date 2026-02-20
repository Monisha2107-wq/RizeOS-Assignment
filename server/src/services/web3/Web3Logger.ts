import { ethers } from 'ethers';

export class Web3Logger {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet | ethers.HDNodeWallet;

  constructor() {
    const rpcUrl = process.env.POLYGON_RPC_URL || 'https://rpc-amoy.polygon.technology/';
    this.provider = new ethers.JsonRpcProvider(rpcUrl);

    const privateKey = process.env.WEB3_PRIVATE_KEY;
    if (!privateKey) {
      console.warn("[Web3] No WEB3_PRIVATE_KEY found in .env. Web3 logging will be disabled.");
    }
    
    this.wallet = privateKey 
      ? new ethers.Wallet(privateKey, this.provider) 
      : ethers.Wallet.createRandom().connect(this.provider);
  }

  public async logTaskCompletion(taskId: string, employeeId: string, orgId: string): Promise<string | null> {
    try {
      console.log(`🔗 [Web3] Preparing to log Task ${taskId} on-chain...`);
      
      const message = JSON.stringify({
        event: 'TASK_COMPLETED',
        taskId: taskId,
        employeeId: employeeId,
        orgId: orgId,
        timestamp: new Date().toISOString()
      });

      const hexData = ethers.hexlify(ethers.toUtf8Bytes(message));

      const tx = await this.wallet.sendTransaction({
        to: this.wallet.address,
        data: hexData
      });

      console.log(`[Web3] Successfully logged to Polygon Testnet!`);
      console.log(`[Web3] Transaction Hash: ${tx.hash}`);
      
      return tx.hash;
    } catch (error: any) {
      console.error(`[Web3] Failed to log on-chain (likely insufficient testnet funds):`, error.message);
      return null;
    }
  }
}

export default new Web3Logger();