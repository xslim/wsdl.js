#import "{{config.classPrefix}}{{name}}Service.h"
#import "{{config.classPrefix}}Result.h"

{{#includes}}
#import "{{../config.classPrefix}}{{this}}.h"
{{/includes}}

/*
namespace: {{namespace}}
serviceUrl: {{serviceUrl}}
*/

@interface {{config.classPrefix}}{{name}}Service ()

@end

@implementation {{config.classPrefix}}{{name}}Service

- (void)configure {
    self.namespace = @"{{namespace}}";
    self.serviceUrl = @"{{serviceUrl}}";
}

{{#operations}}
- (void){{name}}WithRequest:({{../config.classPrefix}}{{request}} *)request
    completionHandler:(void (^)({{../config.classPrefix}}{{response}} *response, NSError *error))completionHandler
{
    [self executeWithRequest:request
                 resultClass:{{../config.classPrefix}}{{response}}.class
                inputElement:@"{{inputElement}}"
               outputElement:@"{{outputElement}}"
                   namespace:@"{{namespace}}"
           completionHandler:^({{../config.classPrefix}}Result *result, NSError *error) {
        completionHandler((id)result, error);
    }];
}

{{/operations}}

- (NSString *)soapNamespaces
{
    NSString *s = ADYStringMultiline(
xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
xmlns:xsd="http://www.w3.org/2001/XMLSchema"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
{{#xmlns}}
xmlns:{{name}}="{{url}}"
{{/xmlns}}
    );
    return s;
}

@end
