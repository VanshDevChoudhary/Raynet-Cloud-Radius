import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface CoaDisconnectParams {
  nasIp: string;
  nasPort?: number;
  secret: string;
  username: string; // Full RADIUS username with tenant prefix
}

export interface CoaChangeRateParams extends CoaDisconnectParams {
  rateLimit: string; // MikroTik-Rate-Limit value
}

// Sends Disconnect-Request via radclient (freeradius-utils package)
export async function sendCoaDisconnect(
  params: CoaDisconnectParams
): Promise<boolean> {
  const { nasIp, nasPort = 3799, secret, username } = params;

  // Sanitize username to prevent command injection
  const safeUsername = username.replace(/[^a-zA-Z0-9_-]/g, "");

  const radclientInput = `User-Name = "${safeUsername}"`;

  try {
    const command = `echo '${radclientInput}' | radclient ${nasIp}:${nasPort} disconnect "${secret}"`;
    const { stdout, stderr } = await execAsync(command, { timeout: 5000 });

    // radclient returns "Received Disconnect-ACK" on success
    if (stdout.includes("Received Disconnect-ACK")) {
      console.log(`[RADIUS] CoA disconnect successful for ${username} on ${nasIp}`);
      return true;
    }

    console.warn(
      `[RADIUS] CoA disconnect failed for ${username} on ${nasIp}:`,
      stdout,
      stderr
    );
    return false;
  } catch (error) {
    console.error(
      `[RADIUS] CoA disconnect error for ${username} on ${nasIp}:`,
      error
    );
    return false;
  }
}

// Sends CoA with new Mikrotik-Rate-Limit via radclient
export async function sendCoaChangeRate(
  params: CoaChangeRateParams
): Promise<boolean> {
  const { nasIp, nasPort = 3799, secret, username, rateLimit } = params;

  // Sanitize username to prevent command injection
  const safeUsername = username.replace(/[^a-zA-Z0-9_-]/g, "");

  const radclientInput = `User-Name = "${safeUsername}"
Mikrotik-Rate-Limit = "${rateLimit}"`;

  try {
    const command = `echo '${radclientInput}' | radclient ${nasIp}:${nasPort} coa "${secret}"`;
    const { stdout, stderr } = await execAsync(command, { timeout: 5000 });

    if (stdout.includes("Received CoA-ACK")) {
      console.log(
        `[RADIUS] CoA rate-change successful for ${username} on ${nasIp} to ${rateLimit}`
      );
      return true;
    }

    console.warn(
      `[RADIUS] CoA rate-change failed for ${username} on ${nasIp}:`,
      stdout,
      stderr
    );
    return false;
  } catch (error) {
    console.error(
      `[RADIUS] CoA rate-change error for ${username} on ${nasIp}:`,
      error
    );
    return false;
  }
}

export async function checkRadclientAvailable(): Promise<boolean> {
  try {
    const { stdout } = await execAsync("which radclient", { timeout: 2000 });
    return stdout.trim().length > 0;
  } catch (error) {
    console.warn(
      "[RADIUS] radclient not found. CoA features will not work. Install with: apt-get install freeradius-utils"
    );
    return false;
  }
}
