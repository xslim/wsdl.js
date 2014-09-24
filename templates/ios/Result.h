#import "{{config.classPrefix}}Result.h"

{{#includes}}
@class {{this}};
{{/includes}}

@interface {{config.classPrefix}}{{name}} : {{config.classPrefix}}Result

{{#properties}}
{{#if comment}}
/**
{{{comment}}}
*/
{{/if}}
@property (nonatomic, {{#if strong}}strong{{else}}assign{{/if}}) {{type}} {{#if ptr}}*{{/if}}{{name}};

{{/properties}}


@end
