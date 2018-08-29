const browser = require('./browser');
const compare = require('./compare')
const scheduler = require('./scheduler');
const storage = require('./storage');


class Observer {

  static async schedule(job) {
    return storage.load(job.target).then(stored => { 
      if (!stored) {
        return browser.load(job.target).then(data =>
          storage.save(job.target, data));
      }
      else {
        return Promise.resolve();
      }
    }).then(() => {
      scheduler.add(Observer.updateAndNotify.bind(job), job.interval);
    }).catch(error => {
      console.error(error);
    });
  }

  static async updateAndNotify() {
    Promise.all([
      storage.load(this.target),
      browser.load(this.target)
    ]).then(data => { 
      const diff = compare(data[0], data[1]);
      if (diff.length > 0) {
        return this.notify(diff).then( () => storage.save(this.target, diff) );
      }
    }).catch(error => {
      console.error(error);
    });
  }

}

module.exports = Observer;