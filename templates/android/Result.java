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

@end
