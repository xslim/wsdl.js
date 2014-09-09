
public class {{name}}Service {

  {{#operations}}
  /*
  response: {{response}}
  */
  public void {{name}}(request <{{request}}>, completionHandler);
  {{/operations}}

}
