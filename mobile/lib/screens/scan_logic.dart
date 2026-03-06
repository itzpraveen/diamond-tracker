import 'package:dio/dio.dart';

const String dispatchBatchRequiredMessage =
    'Dispatch scan requires a voucher. Open Dispatch Center and scan from there.';
const String batchRequiredBadgeLabel = 'Voucher Required';

String? scanBlockingReason(
    {required String? nextStatus, required String? batchId}) {
  if (nextStatus == 'DISPATCHED_TO_FACTORY' &&
      (batchId == null || batchId.trim().isEmpty)) {
    return dispatchBatchRequiredMessage;
  }
  return null;
}

bool shouldSuggestDispatchCenter({
  required String? nextStatus,
  required String? blockingReason,
  required String? errorMessage,
}) {
  if (blockingReason != null && blockingReason.isNotEmpty) {
    return true;
  }
  if (nextStatus != 'DISPATCHED_TO_FACTORY') {
    return false;
  }
  final message = errorMessage?.toLowerCase() ?? '';
  if (message.isEmpty) {
    return false;
  }
  return message.contains('batch') ||
      message.contains('voucher') ||
      message.contains('dispatch');
}

String readableApiError(Object error) {
  if (error is DioException) {
    final detail = _extractErrorDetail(error.response?.data);
    if (detail != null && detail.isNotEmpty) {
      return detail;
    }
    final message = error.message;
    if (message != null && message.isNotEmpty) {
      return message;
    }
  }
  return error.toString();
}

bool isUnauthorizedError(Object error) {
  if (error is DioException) {
    if (error.response?.statusCode == 401) {
      return true;
    }
    final message = readableApiError(error).toLowerCase();
    return message.contains('invalid token') ||
        message.contains('invalid refresh token') ||
        message.contains('refresh token') ||
        message.contains('unauthorized');
  }
  return false;
}

String? _extractErrorDetail(Object? data) {
  if (data is String) {
    final trimmed = data.trim();
    if (trimmed.isNotEmpty) {
      return trimmed;
    }
    return null;
  }
  if (data is! Map) {
    return null;
  }

  final detail = data['detail'];
  if (detail is String && detail.isNotEmpty) {
    return detail;
  }
  if (detail is List) {
    final messages = detail
        .map((item) {
          if (item is Map && item['msg'] is String) {
            return item['msg'] as String;
          }
          return null;
        })
        .whereType<String>()
        .where((message) => message.isNotEmpty)
        .toList();
    if (messages.isNotEmpty) {
      return messages.join(', ');
    }
  }

  final message = data['message'];
  if (message is String && message.isNotEmpty) {
    return message;
  }
  final error = data['error'];
  if (error is String && error.isNotEmpty) {
    return error;
  }
  return null;
}
