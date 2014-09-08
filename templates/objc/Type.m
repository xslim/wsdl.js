#import "{{config.classPrefix}}{{name}}Type.h"

@interface {{config.classPrefix}}{{name}}Type ()
@end

/**
namespace: {{namespace}}
*/

@implementation {{config.classPrefix}}{{name}}Type

- (void)initProperty:(NSString *)prop {
{{#properties}}
  {{#if native}}
  {{else}}
  if ([prop isEqual:@"{{name}}"]) {
    self.{{name}} = {{type}}.new;
  }
  {{/if}}
{{/properties}}
}

- (void)initProperties {
}

- (NSString *)toSoapXml {
    NSString *tpl = ADYStringMultiline(
{{#properties}}
  {{#if native}}
  \{{# {{name}} }}<{{namespace}}{{name}}>\{{ {{name}} }}</{{namespace}}{{name}}>\{{/ {{name}} }}
  {{else}}
  \{{# {{name}} }}
  <{{namespace}}{{name}}>
  \{{ {{name}}.toSoapXml }}
  </{{namespace}}{{name}}>
  \{{/ {{name}} }}
  {{/if}}
{{/properties}}
    );

    NSString *xml = [ADYTemplate renderObject:self fromString:tpl];
    return xml;
}

@end
