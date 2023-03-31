const sqlite3 = require('sqlite3');


const { dbName, tableName } = global.config;
const db = new sqlite3.Database(dbName);

db.run(`CREATE TABLE IF NOT EXISTS ${tableName} (
    dateTime TEXT NOT NULL,
    jobid TEXT PRIMARY KEY,
    testFile TEXT NOT NULL,
    status TEXT,
    reportUrl TEXT,
    numTotalTests INTEGER(6),
    numPassedTests INTEGER(6),
    numFailedTests INTEGER(6),
    numTotalTestSuites INTEGER(6) DEFAULT 0,
    numPassedTestSuites INTEGER(6) DEFAULT 0,
    numFailedTestSuites INTEGER(6) DEFAULT 0,
    logs TEXT
    )`,
    (error, row) => {
        console.log(error);
    }
);

dbhandler = {
    select: function (reqRows, whereCondition) {
        return new Promise(async function (resolve, reject) {
            // let query = `SELECT * FROM ${tableName} WHERE `;
            // if (param) {
            //     query += param;
            // } else {
            //     query += "status = 'in-progress' OR status = 'in-queue'";
            // }
            let query = `SELECT ${reqRows} FROM ${tableName}`;
            if(whereCondition){
                query += ` WHERE jobid = '${whereCondition}'`
            }
            db.all(query, (error, rows) => {
                if (error) console.log('SELECT ERROR', error);
                resolve(rows)
            });
        })
    },
    insert: function (param) {
        return new Promise(async function (resolve, reject) {
            let query = `INSERT INTO ${tableName} (dateTime, jobid, testFile, status, logs) VALUES ( "${param.dateTime}", "${param.jobid}", "${param.testSet}", "${param.status}", "${param.logs}")`;

            db.run(query,
                function (error) {
                    if (error) console.log('INSERT ERROR', error);
                    resolve(this.lastID)
                })
        })
    },
    update: function (updates, primaryKey) {
        return new Promise(async function (resolve, reject) {
            let query = `UPDATE ${tableName} SET `;
            let updateStr = ``;
            for (let upd in updates) {
                updateStr += `${upd} = "${updates[upd]}" , `;
            }
            updateStr = updateStr.replace(/, $/, '')
            query += `${updateStr} WHERE jobid = "${primaryKey}"`;

            db.run(query,
                function (error, row) {
                    if (error) {
                        console.log('UPDATE ERROR', error);
                    }
                    resolve(row);
                })
        })
    }
}

module.exports = dbhandler;