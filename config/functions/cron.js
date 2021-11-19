"use strict";

/**
 * Cron config that gives you an opportunity
 * to run scheduled jobs.
 *
 * The cron format consists of:
 * [SECOND (optional)] [MINUTE] [HOUR] [DAY OF MONTH] [MONTH OF YEAR] [DAY OF WEEK]
 *
 * See more details here: https://strapi.io/documentation/v3.x/concepts/configurations.html#cron-tasks
 */

module.exports = {
  "*/1 * * * *": () => {
    function formatDateToUTC(date) {
      const UTCMseconds =
        new Date(date).getTime() +
        new Date(date).getTimezoneOffset() * 60 * 1000;
      const UTCseconds = Math.round(UTCMseconds / 1000);
      return UTCseconds;
    }

    function filterMaturedTransactions(trxns) {
      try {
        const currentDate = new Date();
        const filteredTransactions = trxns.filter(
          (trxn) =>
            formatDateToUTC(currentDate) >= formatDateToUTC(trxn.maturityDate)
        );
        return filteredTransactions;
      } catch (error) {
        console.log(error);
      }
    }
    async function setMatured() {
      const transactions = await strapi
        .query("transaction")
        .find({ _limit: -1 });
      const maturedTransactions = filterMaturedTransactions(transactions);
      maturedTransactions.forEach((transaction) => {
        transaction.matured = true;
        const updateDailyEarnings = strapi
          .query("transaction")
          .update({ id: transaction.id }, transaction);
      });
      console.log("done");
    }
    setMatured();
  },
  "*/2 * * * *": async () => {
    const transactions = await strapi.query("transaction").find({ _limit: -1 });
    transactions.forEach((transaction, index, transactionArr) => {
      if (transaction.matured === false) {
        transaction.dailyEarnings =
          transaction.dailyEarnings + transaction.amountToBeAddedDaily;
        const updateDailyEarnings = strapi
          .query("transaction")
          .update({ id: transaction.id }, transaction);
        console.log(updateDailyEarnings);
      } else {
        transaction.dailyEarnings = transaction.dailyEarnings + 0;
      }
    });
  },
};
