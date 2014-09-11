public class {{name}} implements KvmSerializable {


    {{#properties}}
    {{#if comment}}
    /**
    {{{comment}}}
    */
    {{/if}}
    private {{type}} {{name}};
    {{/properties}}

    {{#properties}}
    public void set{{upperCaseName}}({{type}} {{name}}) {
        this.{{name}} = {{name}};
    }

    public String get{{upperCaseName}}() {
        return this.{{name}};
    }

    {{/properties}}

    public Object getProperty(int arg0) {
        switch(arg0) {
        {{#each properties}}
        case {{@index}}:
            return {{this.name}};
        {{/each}}
        default: break;
        }
        return null;
    }
    
    public int getPropertyCount() {
        return {{numberOfProperties}};
    }

    public void getPropertyInfo(int index, Hashtable arg1, PropertyInfo info) {
        switch(index) {
        {{#each properties}}
        case {{@index}}:
            {{#if native}}
            info.type = PropertyInfo.{{upperCaseType}}_CLASS;
            {{else}}
            infoType = new {{type}}.getClass();
            {{/if}}
        {{/each}} 
        default: break;
        }   
    }

    public Object getValueForType(Object value, String type) {
        if(type == 'Long') {
            return Long.parseLong(value.toString());
        } else if(type == 'Integer') {
            return Integer.parseInt(value.toString());
        } else {
            String.valueOf(value);
        }
    }

    public void setProperty(int index, Object value) {                                                            switch(index) {                                                                                           {{#each properties}}                                                                             
        case {{@index}}:                                                                                 
            {{#if native}}                                                                               
            {{this.name}} = getValueForType(value, {{type}});                                            
            {{else}}                                                                                     
            {{this.name}} = ({{type}})value;                                                             
            {{/if}}                                                                                      
        {{/each}}                                                                                        
        default: break;                                                                                  
        }                                                                                                     }  

}
