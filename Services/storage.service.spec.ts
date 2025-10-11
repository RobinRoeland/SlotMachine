import { TestBed } from '@angular/core/testing';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StorageService);
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getItem and setItem', () => {
    it('should store and retrieve a string', () => {
      service.setItem('test_key', 'test_value');
      expect(service.getItem('test_key')).toBe('test_value');
    });

    it('should store and retrieve an object', () => {
      const testObj = { name: 'test', value: 123 };
      service.setItem('test_key', testObj);
      expect(service.getItem('test_key')).toEqual(testObj);
    });

    it('should store and retrieve an array', () => {
      const testArray = [1, 2, 3];
      service.setItem('test_key', testArray);
      expect(service.getItem('test_key')).toEqual(testArray);
    });

    it('should return default value if key does not exist', () => {
      expect(service.getItem('nonexistent', 'default')).toBe('default');
    });

    it('should return null if key does not exist and no default provided', () => {
      expect(service.getItem('nonexistent')).toBeNull();
    });
  });

  describe('watch', () => {
    it('should emit when value changes', (done) => {
      const testValue = 'test_value';
      
      service.watch('test_key').subscribe(value => {
        if (value === testValue) {
          expect(value).toBe(testValue);
          done();
        }
      });

      service.setItem('test_key', testValue);
    });

    it('should emit to multiple subscribers', (done) => {
      let count = 0;
      const testValue = 'test_value';
      
      const checkDone = () => {
        count++;
        if (count === 2) done();
      };

      service.watch('test_key').subscribe(value => {
        if (value === testValue) checkDone();
      });

      service.watch('test_key').subscribe(value => {
        if (value === testValue) checkDone();
      });

      service.setItem('test_key', testValue);
    });
  });

  describe('removeItem', () => {
    it('should remove an item from storage', () => {
      service.setItem('test_key', 'test_value');
      service.removeItem('test_key');
      expect(service.getItem('test_key')).toBeNull();
    });
  });

  describe('convenience methods', () => {
    it('should get and set items', () => {
      const items = [{ name: 'item1', imageSrc: 'img1' }];
      service.setItems(items);
      expect(service.getItems()).toEqual(items);
    });

    it('should get and set odds', () => {
      const odds = { item1: 0.5, item2: 0.5 };
      service.setOdds(odds);
      expect(service.getOdds()).toEqual(odds);
    });

    it('should get and set prizes', () => {
      const prizes = [{ pattern: ['*', '*'], reward: 'test' }];
      service.setPrizes(prizes);
      expect(service.getPrizes()).toEqual(prizes);
    });

    it('should get and set roller count', () => {
      service.setRollerCount(5);
      expect(service.getRollerCount()).toBe(5);
    });

    it('should get and set pity value', () => {
      service.setPityValue(20);
      expect(service.getPityValue()).toBe(20);
    });

    it('should get and set pity enabled', () => {
      service.setPityEnabled(true);
      expect(service.getPityEnabled()).toBe(true);
    });

    it('should get and set spins without win', () => {
      service.setSpinsWithoutWin(5);
      expect(service.getSpinsWithoutWin()).toBe(5);
    });
  });

  describe('default values', () => {
    it('should return empty array for items if not set', () => {
      expect(service.getItems()).toEqual([]);
    });

    it('should return empty object for odds if not set', () => {
      expect(service.getOdds()).toEqual({});
    });

    it('should return 4 for roller count if not set', () => {
      expect(service.getRollerCount()).toBe(4);
    });

    it('should return 10 for pity value if not set', () => {
      expect(service.getPityValue()).toBe(10);
    });

    it('should return false for pity enabled if not set', () => {
      expect(service.getPityEnabled()).toBe(false);
    });

    it('should return 0 for spins without win if not set', () => {
      expect(service.getSpinsWithoutWin()).toBe(0);
    });
  });
});
