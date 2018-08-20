const mock = {
  launch: jest.fn(),

  browser: {
    newPage : jest.fn(),

    page: {
      goto: jest.fn(),
      content: jest.fn(),
      close: jest.fn()
    }

  }
};

jest.mock('puppeteer', () => {
  return {
    launch: mock.launch.mockResolvedValue({
      newPage: mock.browser.newPage.mockResolvedValue({
        goto: mock.browser.page.goto,
        content: mock.browser.page.content.mockResolvedValue(42),
        close: mock.browser.page.close
      })
    })
  };
});


const browser = require('./browser.js');

test('Creates new page and visits reguested URL', async () => {
  await browser.getHtml('http://google.com/');

  expect(mock.browser.newPage).toHaveBeenCalled();
  expect(mock.browser.page.goto).toHaveBeenLastCalledWith('http://google.com/');
});


test('Calls navigate(page) function if passed as parameter', async () => {
  const navigate = jest.fn();
  await browser.getHtml('http://google.com/', navigate);

  expect(navigate).toHaveBeenCalled();
});


test('Returns html content from page.content() method', async () => {
  const html = await browser.getHtml('http://google.com/');

  expect(mock.browser.page.content).toHaveBeenCalled();
  expect(html).toBe(42);
});


test('Closes browser page after execution', async () => {
  const html = await browser.getHtml('http://google.com/');

  expect(mock.browser.page.close).toHaveBeenCalled();
})