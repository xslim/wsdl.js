public class {{name}}ServiceImpl implements {{name}}Service {

    private final String NAMESPACE = "{{namespace}}";
    private final String URL = "{{serviceUrl}}";

    {{#operations}}
    /*
    response: {{response}}
    */
    public SoapObject {{name}}({{../config.classPrefix}}{{request}} request) {
	    final String METHOD_NAME = "{{name}}";  
	    final String SOAP_ACTION = "{{name}}";

	    SoapObject soapObjectRequest = new SoapObject(NAMESPACE, METHOD_NAME);

	    PropertyInfo propertyInfo = new PropertyInfo();
	    propertyInfo.setName("{{../config.classPrefix}}{{request}}");
	    propertyInfo.setValue(request);
	    propertyInfo.setType(request.getClass());

	    soapObjectRequest.addProperty(propertyInfo);

	    SoapSerializationEnvelope envelope = new SoapSerializationEnvelope(SoapEnvelope.VER11);
        envelope.setOutputSoapObject(soapObjectRequest);

	    envelope.addMapping(NAMESPACE, 
                            "{{../config.classPrefix}}{{request}}", 
                            new {{../config.classPrefix}}{{request}}().getClass());
        HttpTransportSE androidHttpTransport = new HttpTransportSE(URL);

	    try{
	        androidHttpTransport.call(SOAP_ACTION, envelope);
	        SoapObject response = (SoapObject)envelope.getResponse();
	        return response;
	    }catch(Exception e) {
	        Log.e("", "", e);
	    }
	    return null;
    }
    {{/operations}}
}
