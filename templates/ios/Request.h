#import "{{config.classPrefix}}Request.h"

{{#includes}}
@class {{this}};
{{/includes}}

@interface {{config.classPrefix}}{{name}} : {{config.classPrefix}}Request

{{#properties}}
{{#if comment}}
/**
{{{comment}}}
*/
{{/if}}
@property (nonatomic, {{#if strong}}strong{{else}}assign{{/if}}) {{type}} {{#if ptr}}*{{/if}}{{name}};

{{/properties}}


@end
