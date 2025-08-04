import type { ChatInputCommandInteraction, Guild } from 'discord.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ResetGuildSettings, ResetStatus, renderProgressBar } from './resetModel';

describe('ResetJob', () => {
  it('should initialize ResetGuildSettings correctly', () => {
    const guild = { id: '123' } as Guild;
    const job = new ResetGuildSettings(guild);

    expect(job['guild']).toBe(guild);
    expect(job.totalRowsAffected).toBe(0);
    expect(job.status).toBe(ResetStatus.Waiting);
  });

  it('should transition from Waiting to Planning and then to Ready on plan()', async () => {
    const guild = { id: '123' } as Guild;
    const job = new ResetGuildSettings(guild);

    // @ts-ignore testing (protected method)
    vi.spyOn(job, 'getPlan').mockResolvedValue({ rowEstimation: 100 });

    await job.plan();

    expect(job.status).toBe(ResetStatus.Ready);
    expect(job['rowEstimation']).toBe(100);
  });

  it('should not allow plan() to be called twice', async () => {
    const guild = { id: '123' } as Guild;
    const job = new ResetGuildSettings(guild);

    // @ts-ignore testing (protected method)
    vi.spyOn(job, 'getPlan').mockResolvedValue({ rowEstimation: 100 });

    await job.plan();

    expect(job.status).toBe(ResetStatus.Ready);
    expect(job['rowEstimation']).toBe(100);

    await expect(() => job.plan()).rejects.toThrowError(
      'ResetJob.plan() called during stage 2 (expected 0)',
    );
  });

  it('throws if ran too early', async () => {
    const guild = { id: '123' } as Guild;
    const job = new ResetGuildSettings(guild);

    await expect(() => job.run()).rejects.toThrowError(
      'run() should only be called when the job is [Ready: 2] or [Executing: 3] (found 0)',
    );

    await expect(() => job.runUntilComplete()).rejects.toThrowError(
      'runUntilComplete should only be called when the job is [Ready: 2] (found 0)',
    );
  });

  it('updates its status during run()', async () => {
    const guild = { id: '123' } as Guild;
    const job = new ResetGuildSettings(guild);

    // @ts-ignore testing (protected method)
    vi.spyOn(job, 'getPlan').mockResolvedValue({ rowEstimation: 100 });
    // @ts-ignore testing (protected method)
    vi.spyOn(job, 'runIter').mockResolvedValue(false);

    await job.plan();

    await job.run();
    expect(job.status).toBe(ResetStatus.Executing);

    await job.run();
    expect(job.status).toBe(ResetStatus.Executing);

    // @ts-ignore testing (protected method)
    vi.spyOn(job, 'runIter').mockResolvedValue(true);

    await job.run();
    expect(job.status).toBe(ResetStatus.Complete);
  });

  it('will always be 100% complete after run(), regardless of initial rowEstimation', async () => {
    const guild = { id: '123' } as Guild;
    const job = new ResetGuildSettings(guild);

    // @ts-ignore testing (protected method)
    vi.spyOn(job, 'getPlan').mockResolvedValue({ rowEstimation: 100 });
    // @ts-ignore testing (protected method)
    vi.spyOn(job, 'runIter').mockResolvedValue(false);

    await job.plan();

    await job.run();
    expect(job.status).toBe(ResetStatus.Executing);

    await job.run();
    expect(job.status).toBe(ResetStatus.Executing);
    expect(job.totalRowsAffected).toBe(0);
    expect(job['rowEstimation']).toBe(100);

    // @ts-ignore testing (protected method)
    vi.spyOn(job, 'runIter').mockResolvedValue(true);

    await job.run();
    expect(job.status).toBe(ResetStatus.Complete);
    expect(job.totalRowsAffected).toBe(0);
    // job.rowEstimation should be equal to totalRowsAffected when done
    expect(job['rowEstimation']).toBe(0);
  });
});

describe('ResetGuildSettings', () => {
  let resetGuildSettings: ResetGuildSettings;
  let interaction: ChatInputCommandInteraction<'cached'>;

  beforeEach(() => {
    // Mock the ChatInputCommandInteraction
    interaction = { editReply: vi.fn() } as unknown as ChatInputCommandInteraction<'cached'>;
    resetGuildSettings = new ResetGuildSettings({ id: '123' } as Guild);
  });

  it('correctly generates progress bar', () => {
    const progressBar = renderProgressBar(0.5);
    expect(progressBar).toContain('50%');
  });

  it('getStatusContent returns correct status message', () => {
    // partially completed
    resetGuildSettings['_totalRowsAffected'] = 50;
    resetGuildSettings['rowEstimation'] = 100;

    const statusContent = resetGuildSettings['getStatusContent']();
    expect(statusContent).toContain('Resetting Server Settings...');
    expect(statusContent).toContain('50%');
    expect(statusContent).toContain('\u001b[1;33m');

    // fully completed
    resetGuildSettings['_totalRowsAffected'] = 100;

    const statusContent2 = resetGuildSettings['getStatusContent']();
    expect(statusContent2).toContain('Reset complete!');
    expect(statusContent2).toContain('100%');
    expect(statusContent2).toContain('\u001b[1;32m');
  });

  it('calls interaction.editReply in logStatus()', async () => {
    resetGuildSettings['_totalRowsAffected'] = 50;
    resetGuildSettings['rowEstimation'] = 100;

    await resetGuildSettings.logStatus(interaction);
    expect(interaction.editReply).toHaveBeenCalledWith({
      content:
        '### Resetting Server Settings...\n```ansi\n\u001b[1;33m==============\u001b[30m-------------\u001b[0m | \u001b[1;36m50%\n```',
    });
  });
});

describe('Reset Queue', () => {
  const guild = { id: '123' } as Guild;
  const sleep = (milliseconds: number) => {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lets multiple jobs plan concurrently', async () => {
    const job1 = new ResetGuildSettings(guild);
    const job2 = new ResetGuildSettings(guild);

    // @ts-ignore testing (protected method)
    vi.spyOn(job1, 'getPlan').mockImplementation(async () => {
      await sleep(1000);
      return { rowEstimation: 500 };
    });

    // @ts-ignore testing (protected method)
    vi.spyOn(job2, 'getPlan').mockResolvedValue(async () => {
      await sleep(700);
      return { rowEstimation: 100 };
    });

    // check that planning is concurrent
    const start = Date.now();
    const promises = [job1.plan(), job2.plan()];
    await vi.runOnlyPendingTimersAsync();
    await Promise.all(promises);
    const end = Date.now();
    const duration = end - start;

    expect(duration).toBeGreaterThan(990); // duration should be appx. 1000ms
    expect(duration).toBeLessThan(1100);
  });

  it('executes jobs consecutively', async () => {
    const guild = { id: '123' } as Guild;
    const job1 = new ResetGuildSettings(guild);
    const job2 = new ResetGuildSettings(guild);

    // @ts-ignore testing (protected method)
    vi.spyOn(job1, 'getPlan').mockResolvedValue({ rowEstimation: 500 });
    // @ts-ignore testing (protected method)
    vi.spyOn(job2, 'getPlan').mockResolvedValue({ rowEstimation: 500 });
    await job1.plan();
    await job2.plan();

    // @ts-ignore testing (protected method)
    vi.spyOn(job1, 'runIter')
      // @ts-ignore testing
      .mockImplementationOnce(async () => {
        await sleep(500);
        return false;
      })
      // @ts-ignore testing
      .mockImplementationOnce(async () => {
        await sleep(500);
        return true;
      });

    // @ts-ignore testing (protected method)
    vi.spyOn(job2, 'runIter')
      // @ts-ignore testing
      .mockImplementationOnce(async () => {
        await sleep(200);
        return false;
      })
      // @ts-ignore testing
      .mockImplementationOnce(async () => {
        await sleep(300);
        return true;
      });

    // check that running is not concurrent
    const start = Date.now();
    const promises = [job1.runUntilComplete(), job2.runUntilComplete()];
    await vi.runAllTimersAsync();
    await Promise.all(promises);
    const end = Date.now();
    const duration = end - start;

    expect(duration).toBeGreaterThan(1490); // duration should be appx. 1500ms
    expect(duration).toBeLessThan(1600);
  });

  it('executes jobs consecutively, when run intermittently', async () => {
    const guild = { id: '123' } as Guild;
    const job1 = new ResetGuildSettings(guild);
    const job2 = new ResetGuildSettings(guild);

    // @ts-ignore testing (protected method)
    vi.spyOn(job1, 'getPlan').mockResolvedValue({ rowEstimation: 500 });
    // @ts-ignore testing (protected method)
    vi.spyOn(job2, 'getPlan').mockResolvedValue({ rowEstimation: 500 });
    await job1.plan();
    await job2.plan();

    // @ts-ignore testing (protected method)
    vi.spyOn(job1, 'runIter')
      // @ts-ignore testing
      .mockImplementationOnce(async () => {
        await sleep(500);
        return false;
      })
      // @ts-ignore testing
      .mockImplementationOnce(async () => {
        await sleep(500);
        return true;
      });

    // @ts-ignore testing (protected method)
    vi.spyOn(job2, 'runIter')
      // @ts-ignore testing
      .mockImplementationOnce(async () => {
        await sleep(100);
        return false;
      })
      // @ts-ignore testing
      .mockImplementationOnce(async () => {
        await sleep(100);
        return false;
      })
      // @ts-ignore testing
      .mockImplementationOnce(async () => {
        await sleep(300);
        return true;
      });

    // check that running is not concurrent
    const start = Date.now();
    let promise = job1.run();
    await vi.runOnlyPendingTimersAsync();
    expect(await promise).toBe(false);

    promise = job2.run();
    await vi.runOnlyPendingTimersAsync();
    expect(await promise).toBe(false);

    promise = job1.run();
    await vi.runOnlyPendingTimersAsync();
    expect(await promise).toBe(true);

    promise = job2.run();
    await vi.runOnlyPendingTimersAsync();
    expect(await promise).toBe(false);

    promise = job2.run();
    await vi.runOnlyPendingTimersAsync();
    expect(await promise).toBe(true);

    await vi.runOnlyPendingTimersAsync();

    const end = Date.now();
    const duration = end - start;

    expect(duration).toBeGreaterThan(1490); // duration should be appx. 1500ms
    expect(duration).toBeLessThan(1600);
  });

  it('executes jobs consecutively, including globalBufferTime', async () => {
    const guild = { id: '123' } as Guild;
    const job1 = new ResetGuildSettings(guild);
    const job2 = new ResetGuildSettings(guild);

    // @ts-ignore testing (protected method)
    vi.spyOn(job1, 'getPlan').mockResolvedValue({ rowEstimation: 500 });
    // @ts-ignore testing (protected method)
    vi.spyOn(job2, 'getPlan').mockResolvedValue({ rowEstimation: 500 });
    await job1.plan();
    await job2.plan();

    // @ts-ignore testing (protected method)
    vi.spyOn(job1, 'runIter')
      // @ts-ignore testing
      .mockImplementationOnce(async () => {
        await sleep(500);
        return false;
      })
      // @ts-ignore testing
      .mockImplementationOnce(async () => {
        await sleep(500);
        return true;
      });

    // @ts-ignore testing (protected method)
    vi.spyOn(job2, 'runIter')
      // @ts-ignore testing
      .mockImplementationOnce(async () => {
        await sleep(100);
        return false;
      })
      // @ts-ignore testing
      .mockImplementationOnce(async () => {
        await sleep(100);
        return false;
      })
      // @ts-ignore testing
      .mockImplementationOnce(async () => {
        await sleep(300);
        return true;
      });

    // check that running is not concurrent
    const start = Date.now();

    let promise = job1.run({ bufferTime: 200 });
    await vi.runAllTimersAsync();
    expect(await promise).toBe(false);

    promise = job2.run();
    await vi.runAllTimersAsync();
    expect(await promise).toBe(false);

    promise = job1.run();
    await vi.runAllTimersAsync();
    expect(await promise).toBe(true);

    promise = job2.run({ bufferTime: 300 });
    await vi.runAllTimersAsync();
    expect(await promise).toBe(false);

    promise = job2.run();
    await vi.runAllTimersAsync();
    expect(await promise).toBe(true);

    /*
     * Global bufferTimes pause the entire queue.
     *      0ms                 500ms               1000ms              1500ms              2000ms
     *      v                   v                   v                   v                   v
     * Time |---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
     * Job1 |EXECUTE--------------->|BUF--->|   |EXECUTE----------->|
     * Job2 |                               |EXE|                   |EXE|BUF------->|EXE------->|
     */

    await vi.runAllTimersAsync();
    const end = Date.now();
    const duration = end - start;

    expect(duration).toBeGreaterThan(1990); // duration should be appx. 2000ms: 1000 for the 1st job, 500 for the second, and 550 for the two bufferTimes
    expect(duration).toBeLessThan(2100);
  });

  it('executes jobs consecutively, including local bufferTimes', async () => {
    const guild = { id: '123' } as Guild;
    const job1 = new ResetGuildSettings(guild);
    const job2 = new ResetGuildSettings(guild);

    // @ts-ignore testing (protected method)
    vi.spyOn(job1, 'getPlan').mockResolvedValue({ rowEstimation: 500 });
    // @ts-ignore testing (protected method)
    vi.spyOn(job2, 'getPlan').mockResolvedValue({ rowEstimation: 500 });
    await job1.plan();
    await job2.plan();

    // @ts-ignore testing (protected method)
    vi.spyOn(job1, 'runIter')
      // @ts-ignore testing
      .mockImplementationOnce(async () => {
        await sleep(500);
        return false;
      })
      // @ts-ignore testing
      .mockImplementationOnce(async () => {
        await sleep(500);
        return true;
      });

    // @ts-ignore testing (protected method)
    vi.spyOn(job2, 'runIter')
      // @ts-ignore testing
      .mockImplementationOnce(async () => {
        await sleep(200);
        return false;
      })
      // @ts-ignore testing
      .mockImplementationOnce(async () => {
        await sleep(300);
        return true;
      });

    // check that running is not concurrent
    const start = Date.now();
    const promises = [
      job1.runUntilComplete({ jobBufferTime: 100 }), // this jobBufferTime should have no effect because it should run while job2's first phase (200ms) is running
      job2.runUntilComplete({ jobBufferTime: 700 }), // this jobBufferTime will have an effect of 200 ms, because it will run during the second stage of job1 (500ms) and still have to wait for 200ms.
    ];
    /*
     * Jobs should never run in parallel, but a jobBufferTime can be parallel with another job.
     *      0ms                 500ms               1000ms
     *      v                   v                   v
     * Time |---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
     * Job1 |EXECUTE--------------->|BUF|   |EXECUTE----------->|
     * Job2 |                       |EXECUTE|BUF----------------------->|EXECUTE--->|
     */
    await vi.runAllTimersAsync();
    await Promise.all(promises);
    const end = Date.now();
    const duration = end - start;

    expect(duration).toBeGreaterThan(1690); // duration should be appx. 1700ms
    expect(duration).toBeLessThan(1800);
  });
});
