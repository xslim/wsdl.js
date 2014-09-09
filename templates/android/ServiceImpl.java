#import "{{name}}ServiceImp.java"

/*
namespace: {{namespace}}
serviceUrl: {{serviceUrl}}
*/

public class{{name}}ServiceImp {

  - private void configure {
      self.namespace = @"{{namespace}}";
      self.serviceUrl = @"{{serviceUrl}}";
  }

  {{#operations}}
  /*
  response: {{response}}
  */
  public void {{name}}(request <{{../config.classPrefix}}{{request}}>, completionHandler) {
    [self executeWithRequest:request
                 resultClass:{{../config.classPrefix}}{{response}}.class
                inputElement:@"{{inputElement}}"
               outputElement:@"{{outputElement}}"
                   namespace:@"{{namespace}}"
           completionHandler:^(ADYResult *result, NSError *error) {
        completionHandler((id)result, error);
    }];
  }

  {{/operations}}

  public String soapNamespaces {
      return "\
  xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\"\
  xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\"\
  xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"\
  {{#xmlns}}\
  xmlns:{{name}}=\"{{url}}\"\
  {{/xmlns}}\
      ";
  }

}
