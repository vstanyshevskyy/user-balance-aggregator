# User Balance Aggregator

Thanks for the challenge. It's an interesting one. 

## Table of Contents
1. [Terms](#terms)
2. [Approach & Time Spent](#approach--time-spent)
3. [System Design](#system-design)
   - [Constraints and Calculations](#constraints-and-calculations)
   - [Approach](#approach)
4. [Installation](#installation)
5. [Project Details](#project-details)
6. [Testing Strategy](#testing-strategy)
7. [Observability](#observability)

## Terms
* **Vendor API**: The external API from which we fetch transaction data.
* **Our API**: The API we are building, which processes and serves aggregated transaction data to clients.

## Approach & Time Spent
* 1h thinking it through and writing the System Design section of this doc.
* 2h setting up the project and writing the code.
* 1h going through it again and reviewing.

## System Design

### Constraints and Calculations
- **Vendor API Limitations**: 5 requests per minute, with a maximum of 1,000 transactions per request.
- **Daily Limit**: This allows us to fetch up to 7,200,000 transactions per day.
- **Assumptions**:
  1. Historical data is not required.
  2. No more than 5,000 transactions are created per minute.
  3. The Vendor API has 100% uptime.

### Challenges
1. **Historical Data**: If required, fetching historical data would require orchestration and scheduling.
2. **API Availability**: In a real-world scenario, the Vendor API may have downtime, requiring retry mechanisms and dead-letter queues.

### Solution Overview
1. **Persistent Storage**: A `transactions` table replicates the Vendor API's data structure. It ensures idemptotency.
2. **Data Fetching**: A cron job fetches data every 20 (5 requests per minute) seconds and writes it to the database.
3. **API**: Provides endpoints to query and aggregate data from the database.

### Approach
Given the rate-limit constraints, calculations on the fly (or proxy API that reads the data and responds during one request) are not possible. 
The solution has to be divided into multiple parts:
1. Persistant storage for our API.
2. Scheduled job(s) to fetch the data from Vendor API and push it into our storage
3. API that queries the data from our storage, aggregates it and returns to it to the requester.


#### Persistant storage
1. Let's replicate the data structure we get from the source API. Table `transactions` with columns `id` (PK), `userId`, `createdAt`, `type`, `amount` needed. Using this table we would be able to:
* Make sure data idempotency
* Extend the API in the future to see user balance at any point of time
* Do the calculations needed.

#### Fetching the data
A cron job running every 20 seconds (remember - 5 req/m), getting the data from source API, and writing it to the DB. I assume that the world is perfect and the source API is always available. Otherwise we would need to track failed requests and re-run them.

#### Payouts
I'm not sure I fully understand `payout` vs `paid_out` transaction. 
I will act following this logic:
- **Payout**: Represents a user's request for a payout. This does not immediately affect the user's balance.
- **Paid Out**: Represents a completed payout, reducing the user's balance.

#### Example:
| Transaction Type | Description                  | Effect on Balance |
|------------------|------------------------------|-------------------|
| `payout`         | User requests a payout       | No effect         |
| `paid_out`       | Payout is completed          | Balance decreases |

For the `/user/:id/payouts` endpoint:
- **Requested Payout** = Total `payout` transactions - Total `paid_out` transactions.
- This shows the outstanding amount to be paid to the user.

#### Aggregation
Querying the data using SQL functions like `SUM` will simplify the code.

#### API
My API is simply fetching the data from the storate and returns it.

### Possible growth challenges
With time, the amount of data will grow, so performance optimization will be needed. For example, keeping the balance pre-calculated in the DB and updating it on each write.

## Installation

Prerequisites
- Node.js (v16 or later)
- npm (v8 or later)

1. Clone the repository:
2. Navigate to the project directory
3. Install the dependencies:
   ```
   npm install
   ```
4. Start the server
   ```
   npm run start
   ```
5. Fetch the data:
* http://localhost:3000/user/12
* http://localhost:3000/user/12/payouts

## Project details
This is an Express.js app (as I have no experience with NestJS). 
I used Sequelize ORM to save us from raw SQL and SQLite DB for simplicity of installation and running.
Inside you can find a cron job that generates some fake transactions - simple way of simulating API request for fetching transaction from source API.
It generates transactions only for `userId` `12`

## Testing Strategy
I had no time for writing tests. If I had more time, I would cover the functions for calculations with unit tests.
I would also add integration tests - generating a few fake transactions and firing some HTTP calls to test my API.
Also the code for fetching data from source API requires good coverage as well - making sure that no duplicates can be created.

## Observability
Fetching data from source API should be monitored closely. Logging around successfull and failed fetches needed. Mechanism to re-run failed fetches is a must have.