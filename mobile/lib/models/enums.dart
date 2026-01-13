enum Role {
  admin,
  purchase,
  packing,
  dispatch,
  factory,
  qcStock,
  delivery
}

enum Status {
  purchased,
  packedReady,
  dispatchedToFactory,
  receivedAtFactory,
  returnedFromFactory,
  receivedAtShop,
  addedToStock,
  handedToDelivery,
  deliveredToCustomer,
  onHold,
  cancelled
}

String statusToApi(Status status) {
  switch (status) {
    case Status.purchased:
      return "PURCHASED";
    case Status.packedReady:
      return "PACKED_READY";
    case Status.dispatchedToFactory:
      return "DISPATCHED_TO_FACTORY";
    case Status.receivedAtFactory:
      return "RECEIVED_AT_FACTORY";
    case Status.returnedFromFactory:
      return "RETURNED_FROM_FACTORY";
    case Status.receivedAtShop:
      return "RECEIVED_AT_SHOP";
    case Status.addedToStock:
      return "ADDED_TO_STOCK";
    case Status.handedToDelivery:
      return "HANDED_TO_DELIVERY";
    case Status.deliveredToCustomer:
      return "DELIVERED_TO_CUSTOMER";
    case Status.onHold:
      return "ON_HOLD";
    case Status.cancelled:
      return "CANCELLED";
  }
}

Status statusFromApi(String value) {
  switch (value) {
    case "PURCHASED":
      return Status.purchased;
    case "PACKED_READY":
      return Status.packedReady;
    case "DISPATCHED_TO_FACTORY":
      return Status.dispatchedToFactory;
    case "RECEIVED_AT_FACTORY":
      return Status.receivedAtFactory;
    case "RETURNED_FROM_FACTORY":
      return Status.returnedFromFactory;
    case "RECEIVED_AT_SHOP":
      return Status.receivedAtShop;
    case "ADDED_TO_STOCK":
      return Status.addedToStock;
    case "HANDED_TO_DELIVERY":
      return Status.handedToDelivery;
    case "DELIVERED_TO_CUSTOMER":
      return Status.deliveredToCustomer;
    case "ON_HOLD":
      return Status.onHold;
    case "CANCELLED":
      return Status.cancelled;
    default:
      return Status.purchased;
  }
}
