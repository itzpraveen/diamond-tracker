import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:diamond_tracker_mobile/screens/scan_logic.dart';

void main() {
  group('scanBlockingReason', () {
    test('returns dispatch batch message when dispatching without batch', () {
      final result = scanBlockingReason(
        nextStatus: 'DISPATCHED_TO_FACTORY',
        batchId: null,
      );

      expect(result, dispatchBatchRequiredMessage);
    });

    test('returns null when dispatch has batch id', () {
      final result = scanBlockingReason(
        nextStatus: 'DISPATCHED_TO_FACTORY',
        batchId: 'f0fb6b77-ec6e-42ed-bd1f-8f4406ec7471',
      );

      expect(result, isNull);
    });
  });

  group('readableApiError', () {
    test('prefers backend detail string from bad response', () {
      final requestOptions = RequestOptions(path: '/jobs/DJ-2026-000059/scan');
      final error = DioException(
        requestOptions: requestOptions,
        response: Response(
          requestOptions: requestOptions,
          statusCode: 400,
          data: <String, dynamic>{'detail': 'Batch id required for dispatch'},
        ),
        type: DioExceptionType.badResponse,
      );

      expect(readableApiError(error), 'Batch id required for dispatch');
    });

    test('collapses validation detail list into readable message', () {
      final requestOptions = RequestOptions(path: '/jobs/DJ-2026-000059/scan');
      final error = DioException(
        requestOptions: requestOptions,
        response: Response(
          requestOptions: requestOptions,
          statusCode: 422,
          data: <String, dynamic>{
            'detail': <Map<String, dynamic>>[
              <String, dynamic>{
                'loc': <String>['body', 'batch_id'],
                'msg': 'Field required',
              },
            ],
          },
        ),
        type: DioExceptionType.badResponse,
      );

      expect(readableApiError(error), 'Field required');
    });
  });

  group('shouldSuggestDispatchCenter', () {
    test('returns true when blocking reason exists', () {
      final result = shouldSuggestDispatchCenter(
        nextStatus: 'DISPATCHED_TO_FACTORY',
        blockingReason: dispatchBatchRequiredMessage,
        errorMessage: null,
      );

      expect(result, isTrue);
    });

    test('returns true when dispatch error mentions batch', () {
      final result = shouldSuggestDispatchCenter(
        nextStatus: 'DISPATCHED_TO_FACTORY',
        blockingReason: null,
        errorMessage: 'Batch id required for dispatch',
      );

      expect(result, isTrue);
    });

    test('returns false for non-dispatch statuses', () {
      final result = shouldSuggestDispatchCenter(
        nextStatus: 'RECEIVED_AT_SHOP',
        blockingReason: null,
        errorMessage: 'Invalid transition',
      );

      expect(result, isFalse);
    });
  });
}
