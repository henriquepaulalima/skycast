import { TtlCache } from './ttl-cache';

describe('TtlCache', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('shares one load between concurrent and repeated requests', async () => {
    const cache = new TtlCache<number>(1_000, 10);
    const load = jest.fn().mockResolvedValue(1);

    await Promise.all([cache.get('key', load), cache.get('key', load)]);
    await cache.get('key', load);

    expect(load).toHaveBeenCalledTimes(1);
  });

  it('loads again after the entry expires', async () => {
    jest.useFakeTimers();
    const cache = new TtlCache<number>(1_000, 10);
    const load = jest.fn().mockResolvedValue(1);

    await cache.get('key', load);
    jest.advanceTimersByTime(1_001);
    await cache.get('key', load);

    expect(load).toHaveBeenCalledTimes(2);
  });

  it('does not keep failed loads', async () => {
    const cache = new TtlCache<number>(1_000, 10);
    const load = jest.fn().mockRejectedValueOnce(new Error('upstream')).mockResolvedValue(2);

    await expect(cache.get('key', load)).rejects.toThrow('upstream');
    await expect(cache.get('key', load)).resolves.toBe(2);
  });

  it('evicts the oldest entry when full', async () => {
    const cache = new TtlCache<string>(1_000, 2);
    const load = jest.fn((value: string) => Promise.resolve(value));

    await cache.get('a', () => load('a'));
    await cache.get('b', () => load('b'));
    await cache.get('c', () => load('c'));
    await cache.get('a', () => load('a'));

    expect(load).toHaveBeenCalledTimes(4);
  });
});
