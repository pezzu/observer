const mockScheduler = {
  add: jest.fn()
};

jest.mock('./scheduler', () => {
  return mockScheduler;
});

const mockStorage = {
  load: jest.fn(),
  save: jest.fn()
}

jest.mock('./storage', () => {
  return mockStorage;
});

const mockBrowser = {
  load: jest.fn()
}

jest.mock('./browser', () => {
  return mockBrowser;
});

const mockCompare = jest.fn();

jest.mock('./compare', () => {
  return mockCompare;
});

beforeEach(() => { 
  mockScheduler.add.mockReset();

  mockStorage.load.mockReset();
  mockStorage.save.mockReset();

  mockBrowser.load.mockReset();

  mockCompare.mockReset();
});

const observer = require('./observer.js');

test('Job is scheduled according to interval', async () => { 
  const job = {
    target: {
      url: 'http://google.com/search?q=halflife3',
      selector: 'a'        
    },
    interval: 60
  };

  mockStorage.load.mockImplementation(job => Promise.resolve([
    { href: 'http://cheapuseddildos.com/', text: 'Half Life 3 free download' },
    { href: 'http://youtube.com/?watch?v=letsplay', text: 'See me waiting for HL3' },
    { href: 'http://eee333.com/new?n=hl3_confirmed', text: 'Half Life 3 (not) confrimed'}
  ]));

  await observer.schedule(job);
  expect(mockScheduler.add.mock.calls[0][1]).toBe(job.interval);
});

// test('Job context is passed to scheduled function', async () => { 
//   const job = {
//     target: {
//       url: 'http://google.com/search?q=halflife3',
//       selector: 'a'        
//     },
//     interval: 60
//   };

//   mockStorage.load.mockImplementation(job => Promise.resolve([
//     { href: 'http://cheapuseddildos.com/', text: 'Half Life 3 free download' },
//     { href: 'http://youtube.com/?watch?v=letsplay', text: 'See me waiting for HL3' },
//     { href: 'http://eee333.com/new?n=hl3_confirmed', text: 'Half Life 3 (not) confrimed'}
//   ]));

//   await observer.schedule(job);
//   expect(mockScheduler.add.mock.calls[0][0]).toBe(job);
// });

test('If job is not present in the storage then it\'s loaded from browser and saved', async () => { 
  const job = {
    target: {
      url: 'http://google.com/search?q=halflife3',
      selector: 'a'        
    },
    interval: 60
  };
  
  const data = [{ href: 'http://cheapuseddildos.com/', text: 'Half Life 3 free download' }];

  mockStorage.load.mockImplementation(job => Promise.resolve(null));
  mockBrowser.load.mockImplementation(job => Promise.resolve(data));

  await observer.schedule(job);
  expect(mockStorage.save.mock.calls[0][0]).toEqual(job.target);
  expect(mockStorage.save.mock.calls[0][1]).toEqual(data);
});


test('Nothing is loaded/saved if job is present in storage', async () => { 
  const job = {
    target: {
      url: 'http://google.com/search?q=halflife3',
      selector: 'a'        
    },
    interval: 60
  };

  const data = [{ href: 'http://cheapuseddildos.com/', text: 'Half Life 3 free download' }];
  mockStorage.load.mockImplementation(job => Promise.resolve(data));

  await observer.schedule(job);
  expect(mockStorage.save.mock.calls.length).toBe(0);
  expect(mockBrowser.load.mock.calls.length).toBe(0);
});


test('Observed object is passed to browser and storage', async () => {
  const job = {
    target: {
      url: 'http://google.com/search?q=halflife3',
      selector: 'a'        
    },
    interval: 60
  };
  
  const update = observer.updateAndNotify.bind(job);
  await update();

  expect(mockStorage.load.mock.calls[0][0]).toEqual(job.target);
  expect(mockBrowser.load.mock.calls[0][0]).toEqual(job.target);
});

test('Results of browser and storage are passed to comparator and then to notify', () => {

});

test('Notify is not called if result from browser and from storage are equal', () => {

});

test('New results are saved after notification', () => { 
  
});

test('Compare, notify aren\'t called if either browser or storage failed to load', () => { 

});
