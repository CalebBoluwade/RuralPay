#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(WidgetStorage, NSObject)
RCT_EXTERN_METHOD(setItem:(NSString *)key value:(NSString *)value)
RCT_EXTERN_METHOD(reloadWidgets)
@end
