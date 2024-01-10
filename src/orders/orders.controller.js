const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({
      status: 400,
      message: `Order must include a ${propertyName}`,
    });
  };
}

function dishesIsArray(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  if (Array.isArray(dishes) && dishes.length > 0) {
    next();
  }
  next({
    status: 400,
    message: `Order must include at least one dish`,
  });
}

function dishesQuantityIntGreaterThanZero(req, res, next) {
  const { data: { dishes } = {} } = req.body;

  for (let i = 0; i < dishes.length; i++) {
    if (
      !dishes[i].quantity ||
      dishes[i].quantity <= 0 ||
      !Number.isInteger(dishes[i].quantity)
    ) {
      next({
        status: 400,
        message: `Dish ${i} must have a quantity that is an integer greater than 0`,
      });
    }
  }
  next();
}

function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    next();
  }
  next({
    status: 404,
    message: `Order ${orderId} not found`,
  });
}

function orderIdMatchRouteId(req, res, next) {
  const { orderId } = req.params;
  const { data: { id } = {} } = req.body;
  if (!id || id === orderId) {
    next();
  }
  next({
    status: 400,
    message: `Dish id does not match route id. Dish: ${id}, Route: ${orderId}`,
  });
}

function statusPropertyIsValid(req, res, next) {
  const { data: { status } = {} } = req.body;
  const validStatus = [
    "pending",
    "prepairing",
    "out-for-delivery",
    "delivered",
  ];
  if (validStatus.includes(status) && status != "delivered") {
    next();
  } else if (status === "delivered") {
    next({
      status: 400,
      message: `A delivered order cannot be changed`,
    });
  }
  next({
    status: 400,
    message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
  });
}

function deleteOrderStatusIsPending(req, res, next) {
  const order = res.locals.order;
  if (order.status === "pending") {
    next();
  }
  next({
    status: 400,
    message: `An order cannot be deleted unless it is pending.`,
  });
}

function list(req, res) {
  res.json({ data: orders });
}

function create(req, res) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    status: status,
    dishes: dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function read(req, res) {
  res.json({ data: res.locals.order });
}

function update(req, res) {
  const order = res.locals.order;
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.status = status;
  order.dishes = dishes;

  res.json({ data: order });
}

function destroy(req, res) {
  const { orderId } = req.params;
  const index = orders.findIndex((order) => order.id === orderId);
  const deletedOrders = orders.splice(index, 1);
  res.sendStatus(204);
}

module.exports = {
  list,
  create: [
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("dishes"),
    dishesIsArray,
    dishesQuantityIntGreaterThanZero,
    create,
  ],
  read: [orderExists, read],
  update: [
    orderExists,
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("dishes"),
    dishesIsArray,
    dishesQuantityIntGreaterThanZero,
    orderIdMatchRouteId,
    statusPropertyIsValid,
    update,
  ],
  delete: [orderExists, deleteOrderStatusIsPending, destroy],
};
