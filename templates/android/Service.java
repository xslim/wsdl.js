public interface {{name}}Service {

    {{#operations}}
    /*
     response: {{response}}
    */
    public SoapObject {{name}}({{request}} request);
    {{/operations}}

}
