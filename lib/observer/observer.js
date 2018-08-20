const browser = require('./browser');
const compare = require('./compare')
const scheduler = require('./scheduler');
const storage = require('./storage');


class Observer {
  // constructor(job) {
  //   this.job = job;
  // }

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
      browser.load(this.job.target),
      storage.load(this.job.target)
    ]).then(data => { 
      const diff = compare(data[0], data[1]);
      if (diff) {
        return this.job.notify(diff).then( () => storage.save(this.job.target, diff) );
      }
    }).catch(error => {
      console.error(error);
    });
  }

}

module.exports = Observer;