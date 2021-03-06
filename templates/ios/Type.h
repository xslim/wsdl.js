#import "{{config.classPrefix}}Type.h"

{{#includes}}
@class {{this}};
{{/includes}}

@interface {{config.classPrefix}}{{name}}Type : {{config.classPrefix}}Type

{{#properties}}
{{#if comment}}
/**
{{{comment}}}
*/
{{/if}}
@property (nonatomic, {{#if strong}}strong{{else}}assign{{/if}}) {{type}} {{#if ptr}}*{{/if}}{{name}};

{{/properties}}


@end
