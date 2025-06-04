const { ObjectId } = require('mongodb');

const data = {
  registrations: [],
  nonchallengers: []
};

function collection(name) {
  const arr = data[name];
  return {
    insertOne: async (doc) => {
      const _id = new ObjectId();
      arr.push({ _id, ...doc });
      return { insertedId: _id };
    },
    find: () => ({
      toArray: async () => arr.slice()
    }),
    updateOne: async (filter, update) => {
      const idx = arr.findIndex(d => d._id.toString() === filter._id.toString());
      if (idx === -1) return { matchedCount: 0, modifiedCount: 0 };
      Object.assign(arr[idx], update.$set || {});
      return { matchedCount: 1, modifiedCount: 1 };
    },
    deleteOne: async (filter) => {
      const idx = arr.findIndex(d => d._id.toString() === filter._id.toString());
      if (idx === -1) return { deletedCount: 0 };
      arr.splice(idx, 1);
      return { deletedCount: 1 };
    }
  };
}

async function getDb() {
  return { collection };
}

module.exports = getDb;
