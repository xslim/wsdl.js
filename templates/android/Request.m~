#import "{{config.classPrefix}}{{name}}.h"

@interface {{config.classPrefix}}{{name}} ()
@end

@implementation {{config.classPrefix}}{{name}}

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
<{{namespace}}{{rootName}}>
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
</{{namespace}}{{rootName}}>
    );
    NSString *xml = [ADYTemplate renderObject:self fromString:tpl];
    return xml;
}


@end
