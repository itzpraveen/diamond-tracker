import 'package:flutter/material.dart';

import 'majestic_theme.dart';

String statusLabel(String? status) {
  switch (status) {
    case 'PURCHASED':
      return 'Purchased';
    case 'PACKED_READY':
      return 'Packed & Ready';
    case 'DISPATCHED_TO_FACTORY':
      return 'Dispatched to Factory';
    case 'RECEIVED_AT_FACTORY':
      return 'Received at Factory';
    case 'RETURNED_FROM_FACTORY':
      return 'Returned from Factory';
    case 'RECEIVED_AT_SHOP':
      return 'Received at Shop';
    case 'ADDED_TO_STOCK':
      return 'Added to Stock';
    case 'HANDED_TO_DELIVERY':
      return 'Handed to Delivery';
    case 'DELIVERED_TO_CUSTOMER':
      return 'Delivered';
    case 'ON_HOLD':
      return 'On Hold';
    case 'CANCELLED':
      return 'Cancelled';
    case 'OFFLINE_PENDING':
      return 'Pending Sync';
    case null:
      return '-';
    default:
      return status.replaceAll('_', ' ').toLowerCase();
  }
}

Color statusColor(String? status) {
  switch (status) {
    case 'DELIVERED_TO_CUSTOMER':
      return MajesticColors.forest;
    case 'CANCELLED':
      return MajesticColors.danger;
    case 'ON_HOLD':
      return MajesticColors.gold;
    case 'OFFLINE_PENDING':
      return MajesticColors.gold;
    default:
      return MajesticColors.pine;
  }
}
