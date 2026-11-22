// Flood guard. rank = how many messages were stored in the last hour up to and including this one (counted from
// the database, so webhook retries of the same message always get the same answer). Beyond the limit the
// notification is dropped; the message itself is already saved and visible in the admin inbox.
export const PER_HOUR = 30

export const withinBudget = (rank, limit = PER_HOUR) => Number.isInteger(rank) && rank >= 1 && rank <= limit
