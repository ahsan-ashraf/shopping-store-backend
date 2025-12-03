export enum Role {
  SuperAdmin = "SuperAdmin",
  Admin = "Admin",
  Seller = "Seller",
  Rider = "Rider",
  Buyer = "Buyer"
}

export enum Gender {
  Male = "male",
  Female = "female",
  Other = "other"
}

export enum UserStatus {
  PendingApproval = "PendingApproval",
  Active = "Active",
  Blocked = "Blocked"
}

export enum PaymentMethod {
  Prepaid = "Prepaid",
  PostPaid = "PostPaid"
}

export enum PaymentStatus {
  Paid = "Paid",
  Pending = "Pending"
}

export enum OrderStatus {
  Processing = "Processing",
  OutForDeliver = "OutForDeliver",
  Delivered = "Delivered",
  FailedToDeliver = "FailedToDeliver",
  ReturnRequested = "ReturnRequested",
  Returned = "Returned"
}

export enum ReturnRequestStatus {
  ReturnRequested = "ReturnRequested",
  ReturnInProgress = "ReturnInProgress",
  Returned = "Returned"
}
