#import "{{config.classPrefix}}Service.h"

{{#includes}}
#import "{{../config.classPrefix}}{{this}}.h"
{{/includes}}

@interface {{config.classPrefix}}{{name}}Service : {{config.classPrefix}}Service

{{#properties}}
@property (nonatomic, {{strong}}) {{type}} {{ptr}}{{name}};
{{/properties}}

{{#operations}}
- (void){{name}}WithRequest:({{../config.classPrefix}}{{request}} *)request
    completionHandler:(void (^)({{../config.classPrefix}}{{response}} *response, NSError *error))completionHandler;

{{/operations}}

@end
