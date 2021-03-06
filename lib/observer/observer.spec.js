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

  mockStorage.load.mockImplementation(target => Promise.resolve(null));
  mockBrowser.load.mockImplementation(target => Promise.resolve(data));

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

test('Results of browser and storage are passed to comparator', async () => {
  const job = {
    target: {
      url: 'http://google.com/search?q=halflife3',
      selector: 'a'        
    },
    interval: 60
  };
  
  const dataStorage = [{ href: 'http://cheapuseddildos.com/', text: 'Half Life 3 free download' }];
  const dataBrowser = [{ href: 'http://cheapuseddildos.com/', text: 'Half Life 3 free download' },
                       { href: 'http://thisisnotphishingsite.com/', text: 'Half Life 3 premium edition' }];
  
  mockBrowser.load.mockImplementation(target => Promise.resolve(dataBrowser));
  mockStorage.load.mockImplementation(target => Promise.resolve(dataStorage));

  const update = observer.updateAndNotify.bind(job);
  await update();

  expect(mockCompare.mock.calls[0]).toEqual([dataStorage, dataBrowser]);
});

test('Notify is called with results of compare', async () => {
  const job =  {
    target: {
      url: 'http://google.com/search?q=halflife3',
      selector: 'a'        
    },
    interval: 60,
    notify: jest.fn()
  };

  const oldData = [{ href: 'http://cheapuseddildos.com/', text: 'Half Life 3 free download' }];
  const newData = [{ href: 'http://cheapuseddildos.com/', text: 'Half Life 3 free download' },
                   { href: 'http://thisisnotphishingsite.com/', text: 'Half Life 3 premium edition' }];
  
  mockStorage.load.mockImplementation(target => Promise.resolve(oldData));
  mockBrowser.load.mockImplementation(target => Promise.resolve(newData));
  
  mockCompare.mockImplementation((oldData, newData) => [newData[1]]);
  const update = observer.updateAndNotify.bind(job);
  await update();

  expect(job.notify.mock.calls[0][0]).toEqual([newData[1]]);
});

test('Notify is not called if compare returns empty result', async () => {
  const job =  {
    target: {
      url: 'http://google.com/search?q=halflife3',
      selector: 'a'        
    },
    interval: 60,
    notify: jest.fn()
  };

  const oldData = [{ href: 'http://cheapuseddildos.com/', text: 'Half Life 3 free download' }];
  const newData = [{ href: 'http://cheapuseddildos.com/', text: 'Half Life 3 free download' }];
  
  mockStorage.load.mockImplementation(job => Promise.resolve(oldData));
  mockBrowser.load.mockImplementation(job => Promise.resolve(newData));
  
  mockCompare.mockImplementation((oldData, newData) => []);
  const update = observer.updateAndNotify.bind(job);
  await update();

  expect(job.notify.mock.calls.length).toBe(0);
});

test('New results are saved after notification', async () => { 
  const job =  {
    target: {
      url: 'http://google.com/search?q=halflife3',
      selector: 'a'        
    },
    interval: 60,
    notify: jest.fn().mockImplementation(diff => Promise.resolve())
  };

  const oldData = [{ href: 'http://cheapuseddildos.com/', text: 'Half Life 3 free download' }];
  const newData = [{ href: 'http://cheapuseddildos.com/', text: 'Half Life 3 free download' },
                   { href: 'http://thisisnotphishingsite.com/', text: 'Half Life 3 premium edition' }];
  
  mockStorage.load.mockImplementation(job => Promise.resolve(oldData));
  mockBrowser.load.mockImplementation(job => Promise.resolve(newData));

  mockCompare.mockImplementation((oldData, newData) => [newData[1]]);
  const update = observer.updateAndNotify.bind(job);
  await update();

  expect(mockStorage.save.mock.calls[0]).toEqual([job.target, [newData[1]]]);
});

test('New results aren\'t saved when compare returns empty result', async () => { 
  const job =  {
    target: {
      url: 'http://google.com/search?q=halflife3',
      selector: 'a'        
    },
    interval: 60,
    notify: jest.fn().mockImplementation(diff => Promise.resolve())
  };

  const oldData = [{ href: 'http://cheapuseddildos.com/', text: 'Half Life 3 free download' }];
  const newData = [{ href: 'http://cheapuseddildos.com/', text: 'Half Life 3 free download' },
                   { href: 'http://thisisnotphishingsite.com/', text: 'Half Life 3 premium edition' }];
  
  mockStorage.load.mockImplementation(job => Promise.resolve(oldData));
  mockBrowser.load.mockImplementation(job => Promise.resolve(newData));

  mockCompare.mockImplementation((oldData, newData) => []);
  const update = observer.updateAndNotify.bind(job);
  await update();

  expect(mockStorage.save.mock.calls.length).toEqual(0);
});

test('New results aren\'t saved if no notification was made', async () => { 
  const job =  {
    target: {
      url: 'http://google.com/search?q=halflife3',
      selector: 'a'        
    },
    interval: 60,
    notify: jest.fn().mockImplementation(diff => Promise.reject())
  };

  const oldData = [{ href: 'http://cheapuseddildos.com/', text: 'Half Life 3 free download' }];
  const newData = [{ href: 'http://cheapuseddildos.com/', text: 'Half Life 3 free download' },
                   { href: 'http://thisisnotphishingsite.com/', text: 'Half Life 3 premium edition' }];
  
  mockStorage.load.mockImplementation(job => Promise.resolve(oldData));
  mockBrowser.load.mockImplementation(job => Promise.resolve(newData));

  mockCompare.mockImplementation((oldData, newData) => [newData[1]]);
  const update = observer.updateAndNotify.bind(job);
  await update();

  expect(mockStorage.save.mock.calls.length).toEqual(0);
});

test('Compare, notify aren\'t called if either browser failed to load', async () => { 
  const job =  {
    target: {
      url: 'http://google.com/search?q=halflife3',
      selector: 'a'        
    },
    interval: 60,
    notify: jest.fn().mockImplementation(diff => Promise.resolve())
  };

  const oldData = [{ href: 'http://cheapuseddildos.com/', text: 'Half Life 3 free download' }];
  const newData = [{ href: 'http://cheapuseddildos.com/', text: 'Half Life 3 free download' },
                   { href: 'http://thisisnotphishingsite.com/', text: 'Half Life 3 premium edition' }];
  
  mockStorage.load.mockImplementation(job => Promise.resolve(oldData));
  mockBrowser.load.mockImplementation(job => Promise.reject());

  mockCompare.mockImplementation((oldData, newData) => [newData[1]]);
  const update = observer.updateAndNotify.bind(job);
  await update();

  expect(mockCompare.mock.calls.length).toEqual(0);
  expect(mockStorage.save.mock.calls.length).toEqual(0);
  expect(job.notify.mock.calls.length).toEqual(0);
});
