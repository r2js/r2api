module.exports = (app, Model) => (obj) => {
  const { qType } = obj;
  const { queryTypes } = Model.schema;
  if (qType && queryTypes && queryTypes.includes(qType)) {
    delete obj.qType; // eslint-disable-line
    return Model[qType](obj);
  }

  return Model.find(obj);
};
