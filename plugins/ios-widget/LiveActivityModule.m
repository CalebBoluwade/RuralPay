#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(LiveActivity, NSObject)
RCT_EXTERN_METHOD(start:(NSString *)transactionId
                  paymentType:(NSString *)paymentType
                  amount:(NSString *)amount
                  merchant:(NSString *)merchant)
RCT_EXTERN_METHOD(update:(NSString *)status
                  amount:(NSString *)amount
                  merchant:(NSString *)merchant
                  elapsed:(nonnull NSNumber *)elapsed)
RCT_EXTERN_METHOD(dismiss)
@end
