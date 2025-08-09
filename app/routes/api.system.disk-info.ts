import type { ActionFunctionArgs, LoaderFunction } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';

interface DiskInfo {
  filesystem: string;
  size: number;
  used: number;
  available: number;
  percentage: number;
  mountpoint: string;
  timestamp: string;
  error?: string;
}

async function runCommand(command: string): Promise<string | null> {
  try {
    const cp: any = await import('node:child_process');
    return await new Promise((resolve, reject) => {
      const exec = cp.exec || cp.default?.exec;
      if (!exec) return resolve(null);
      exec(command, { encoding: 'utf-8' }, (err: any, stdout: string) => {
        if (err) return reject(err);
        resolve(stdout?.toString()?.trim?.() ?? '');
      });
    });
  } catch {
    return null;
  }
}

const getDiskInfo = async (): Promise<DiskInfo[]> => {
  try {
    const platform = typeof process !== 'undefined' ? process.platform : 'browser';

    if (platform === 'darwin') {
      const output = await runCommand('df -k');
      if (!output) {
        return [
          {
            filesystem: 'N/A',
            size: 0,
            used: 0,
            available: 0,
            percentage: 0,
            mountpoint: 'N/A',
            timestamp: new Date().toISOString(),
            error: 'Disk information not available in this environment',
          },
        ];
      }

      const lines = output.split('\n').slice(1);
      let disks = lines.map((line: string) => {
        const parts = line.trim().split(/\s+/);
        const filesystem = parts[0];
        const size = parseInt(parts[1], 10) * 1024; // KB -> bytes
        const used = parseInt(parts[2], 10) * 1024;
        const available = parseInt(parts[3], 10) * 1024;
        const percentageStr = parts[4].replace('%', '');
        const percentage = parseInt(percentageStr, 10);
        const mountpoint = parts[5];

        return {
          filesystem,
          size,
          used,
          available,
          percentage,
          mountpoint,
          timestamp: new Date().toISOString(),
        } as DiskInfo;
      });

      disks = disks.filter(
        (disk) =>
          !disk.filesystem.startsWith('devfs') &&
          !disk.filesystem.startsWith('map') &&
          !disk.mountpoint.startsWith('/System/Volumes') &&
          disk.size > 0,
      );

      return disks;
    }

    if (platform === 'linux') {
      const output = await runCommand('df -k');
      if (!output) {
        return [
          {
            filesystem: 'N/A',
            size: 0,
            used: 0,
            available: 0,
            percentage: 0,
            mountpoint: 'N/A',
            timestamp: new Date().toISOString(),
            error: 'Disk information not available in this environment',
          },
        ];
      }

      const lines = output.split('\n').slice(1);
      let disks = lines.map((line: string) => {
        const parts = line.trim().split(/\s+/);
        const filesystem = parts[0];
        const size = parseInt(parts[1], 10) * 1024; // KB -> bytes
        const used = parseInt(parts[2], 10) * 1024;
        const available = parseInt(parts[3], 10) * 1024;
        const percentageStr = parts[4].replace('%', '');
        const percentage = parseInt(percentageStr, 10);
        const mountpoint = parts[5];

        return {
          filesystem,
          size,
          used,
          available,
          percentage,
          mountpoint,
          timestamp: new Date().toISOString(),
        } as DiskInfo;
      });

      disks = disks.filter(
        (disk) =>
          !disk.filesystem.startsWith('/dev/loop') &&
          !disk.filesystem.startsWith('tmpfs') &&
          !disk.filesystem.startsWith('devtmpfs') &&
          disk.size > 0,
      );

      return disks;
    }

    if (platform === 'win32') {
      const output = await runCommand(
        'powershell "Get-PSDrive -PSProvider FileSystem | Select-Object Name, Used, Free, @{Name=\'Size\';Expression={$_.Used + $_.Free}} | ConvertTo-Json"',
      );

      if (!output) {
        return [
          {
            filesystem: 'N/A',
            size: 0,
            used: 0,
            available: 0,
            percentage: 0,
            mountpoint: 'N/A',
            timestamp: new Date().toISOString(),
            error: 'Disk information not available in this environment',
          },
        ];
      }

      const driveData = JSON.parse(output);
      const drivesArray = Array.isArray(driveData) ? driveData : [driveData];

      return drivesArray.map((drive: any) => {
        const size = drive.Size || 0;
        const used = drive.Used || 0;
        const available = drive.Free || 0;
        const percentage = size > 0 ? Math.round((used / size) * 100) : 0;

        return {
          filesystem: drive.Name + ':\\',
          size,
          used,
          available,
          percentage,
          mountpoint: drive.Name + ':\\',
          timestamp: new Date().toISOString(),
        } as DiskInfo;
      });
    }

    return [
      {
        filesystem: 'Unknown',
        size: 0,
        used: 0,
        available: 0,
        percentage: 0,
        mountpoint: '/',
        timestamp: new Date().toISOString(),
        error: `Unsupported platform: ${platform}`,
      },
    ];
  } catch (error) {
    console.error('Failed to get disk info:', error);
    return [
      {
        filesystem: 'Unknown',
        size: 0,
        used: 0,
        available: 0,
        percentage: 0,
        mountpoint: '/',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    ];
  }
};

export const loader: LoaderFunction = async () => {
  try {
    return json(await getDiskInfo());
  } catch (error) {
    console.error('Failed to get disk info:', error);
    return json(
      [
        {
          filesystem: 'Unknown',
          size: 0,
          used: 0,
          available: 0,
          percentage: 0,
          mountpoint: '/',
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      ],
      { status: 500 },
    );
  }
};

export const action = async ({ request: _request }: ActionFunctionArgs) => {
  try {
    return json(await getDiskInfo());
  } catch (error) {
    console.error('Failed to get disk info:', error);
    return json(
      [
        {
          filesystem: 'Unknown',
          size: 0,
          used: 0,
          available: 0,
          percentage: 0,
          mountpoint: '/',
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      ],
      { status: 500 },
    );
  }
};
