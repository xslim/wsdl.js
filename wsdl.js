#!/usr/bin/env node
/*******************************************************************
wsdl.js
*******************************************************************/

var program = require('commander');
var parser = require('xml2json');
var fs = require('fs');
var path = require('path')
var Handlebars = require('handlebars');


program
    .version('0.0.1')
    .usage('[options] <file>')
    .option('-t, --template [name]', 'Use template [ios]', 'ios')
    .option('-p, --prefix [prefix]', 'Class prefix to use', '')
    .option('-o, --output [directory]', 'Output to specified directory [out]', 'out')
    .parse(process.argv);

if (!program.args.length) {
    program.help();
    return
}

var inputFile = program.args[0]
var outputDir = program.output

console.log("Processing "+inputFile)
console.log("  output: "+outputDir)
console.log("  template: "+program.template)
console.log("  class prefix: "+program.prefix)

var Modeler = {};

Modeler.ARRAY   = 8;
Modeler.GET     = 4;
Modeler.SET     = 2;
Modeler.HIDDEN  = 1;

var wsdl = {
  ns: {},
  xmlns: {},
  services: {},
  messages: {},
  elements: { },
  complexTypes: { },
  simpleTypes: { },
  bindings: { },
  portTypes: {}
}

var classes2gen = {
  type: {},
  request: {},
  result: {},
  namespaces: {}
}

var typeMap = { };

var tplDir = __dirname+'/templates/'+program.template+'/';

var config = require(tplDir+'config')
config['classPrefix'] = program.prefix

var xmlWsdlDefinition = fs.readFileSync(inputFile);
var json = JSON.parse(parser.toJson(xmlWsdlDefinition));
processWSDL(json);

function strStartsWith(str, prefix) {
    return str.indexOf(prefix) === 0;
};

String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

function getNamespace(t) {
  if (t.match(":")) {
    return t.split(":")[0];
  }
  return t;
}

function _stripNamespace(t) {
  if (t.match(":")) {
    return t.split(":")[1];
  }
  return t;
}

function stripNamespace(t) {
  if (t.match(":")) {
    var s = t.split(":");
    var ns = s[0]
    var name = lowercaseFirstLetter(s[1])

    if (ns != 'xsd') {
      if (!classes2gen.namespaces[name]) {
        classes2gen.namespaces[name] = ns
      }
    }

    return s[1]
  }
  return t;
}

function processWSDL(json) {
  findNamespaces(json);
  processServices(json);
  processMessages(json);
  processPortTypes(json);
  processTypes(json);
  processBindings(json);

  genClasses()

};

/*****************************************
<wsdl:definitions xmlns:soap="http://schemas.xmlsoap.org/wsdl/soap/" xmlns:tm="http://microsoft.com/wsdl/mime/textMatching/" xmlns:soapenc="http://schemas.xmlsoap.org/soap/encoding/" xmlns:mime="http://schemas.xmlsoap.org/wsdl/mime/" xmlns:tns="http://firemelon.com/webservices/" xmlns:s1="http://microsoft.com/wsdl/types/" xmlns:s="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://schemas.xmlsoap.org/wsdl/soap12/" xmlns:http="http://schemas.xmlsoap.org/wsdl/http/" targetNamespace="http://firemelon.com/webservices/" xmlns:wsdl="http://schemas.xmlsoap.org/wsdl/">
*****************************************/
function findNamespaces(json) {
  var mapping = {
    'http://schemas.xmlsoap.org/wsdl/soap/': 'soap',
    'http://schemas.xmlsoap.org/wsdl/': 'wsdl',
    'http://schemas.xmlsoap.org/wsdl/http/': 'http',
    'http://www.w3.org/2001/XMLSchema': 'xsd'
  };
  var wsdlDefinitions = json[Object.keys(json)[0]];


  for (var someAttr in wsdlDefinitions) {
    if (mapping.hasOwnProperty(wsdlDefinitions[someAttr])) {
      wsdl.ns[mapping[wsdlDefinitions[someAttr]]] = (someAttr.split(":").concat([""]))[1]+":";
    }
  };

  for (var someAttr in wsdlDefinitions) {
    if (getNamespace(someAttr) == 'xmlns') {
      var ns = _stripNamespace(someAttr)
      if (!strStartsWith(ns, 'wsdl') &&
          !strStartsWith(ns, 'xsd') &&
          !strStartsWith(ns, 'soap')) {
        wsdl.xmlns[ns] = wsdlDefinitions[someAttr]
      }
    }
  }
  //console.log(wsdl.xmlns)

  if (!wsdl.ns.hasOwnProperty('wsdl') || (wsdl.ns['wsdl']==":")) wsdl.ns['wsdl'] = "";

  typeMap[wsdl.ns['xsd']+"string"] = "string";
  typeMap[wsdl.ns['xsd']+"int"] = "int";
  typeMap[wsdl.ns['xsd']+"boolean"] = "boolean";
  typeMap[wsdl.ns['xsd']+"double"] = "double";
  typeMap[wsdl.ns['xsd']+"decimal"] = "decimal";
  typeMap[wsdl.ns['xsd']+"dateTime"] = "dateTime";
  //console.log("Namespaces:", wsdl.ns);
  //console.log("");
};

/******************************************
<wsdl:service name="Service">
  <wsdl:port name="ServiceSoap" binding="tns:ServiceSoap">
    <soap:address location="https://www.blahblah.com/blah/blah/service.asmx"/>
******************************************/
function processServices(json) {
  var wsdlDefinitions = json[wsdl.ns['wsdl']+'definitions'];
  var wsdlServices = wsdlDefinitions[wsdl.ns['wsdl']+'service'];
  if (!(wsdlServices instanceof Array)) wsdlServices = [wsdlServices];
  wsdlServices.forEach(function(someService) {
    var portTags = someService[wsdl.ns['wsdl']+'port'];
    if (!(portTags instanceof Array)) portTags = [portTags];
    portTags.forEach(function(somePort) {
      if (somePort[wsdl.ns['soap']+'address']) {
        wsdl.services[somePort.name] = {
          binding: somePort.binding,
          namespace: wsdlDefinitions["xmlns:"+somePort.binding.split(":")[0]],
          serviceUrl: somePort[wsdl.ns['soap']+'address'].location
        }
      }
    });
  });
  //console.log("Services:", JSON.stringify(wsdl.services,null,2));
  //console.log("");
};

/******************************************
<wsdl:message name="SomeMessageName">
  <wsdl:part name="parameters" element="tns:SomeElementName"/>
</wsdl:message>
<wsdl:message name="SomeMessageName">
  <wsdl:part name="parameters" element="tns:SomeElementName"/>
</wsdl:message>
******************************************/
function processMessages(json) {
  var wsdlDefinitions = json[wsdl.ns['wsdl']+'definitions'];
  var wsdlMessages = wsdlDefinitions[wsdl.ns['wsdl']+'message'];
  if (!(wsdlMessages instanceof Array)) wsdlMessages = [wsdlMessages];
  wsdlMessages.forEach(function(someMessage) {
    // According to the W3 spec, messages can have multiple part's
    wsdl.messages[someMessage.name] = [];
    var wsdlParts = someMessage[wsdl.ns['wsdl']+'part'];
    if (wsdlParts != null) {
      if (!(wsdlParts instanceof Array)) wsdlParts = [wsdlParts];
      wsdlParts.forEach(function(somePart) {
        // According to the W3 spec, parts can have either element or type attributes
        // elements are found here: /wsdl:defintions/wsdl:types/s:schema/s:element
        // types are found here /wsdl:defintions/wsdl:types/s:schema/s:[complex/simple]Type
        if (somePart.element) wsdl.messages[someMessage.name].push(""+stripNamespace(somePart.element));
        if (somePart.type) wsdl.messages[someMessage.name].push("Type"+stripNamespace(somePart.type));
      });
    }
  });
  //console.log("Messages:", wsdl.messages);
  //console.log("");
};


/******************************************
<wsdl:portType name="ServiceSoap">
  <wsdl:operation name="SomeOperationName">
    <wsdl:input message="tns:SomeMessageName"/>
    <wsdl:output message="tns:SomeMessageName"/>
******************************************/
function processPortTypes(json) {
  var wsdlDefinitions = json[wsdl.ns['wsdl']+'definitions'];
  var wsdlPortTypes = wsdlDefinitions[wsdl.ns['wsdl']+'portType'];
  if (!(wsdlPortTypes instanceof Array)) wsdlPortTypes = [wsdlPortTypes];
  wsdlPortTypes.forEach(function(somePortType) {
    wsdl.portTypes[somePortType.name] = { };
    var wsdlOperations = somePortType[wsdl.ns['wsdl']+'operation'];
    if (!(wsdlOperations instanceof Array)) wsdlOperations = [wsdlOperations];
    wsdlOperations.forEach(function(someOperation) {
      wsdl.portTypes[somePortType.name][someOperation.name] = {
        input: stripNamespace(someOperation[wsdl.ns['wsdl']+'input']['message']),
        output: stripNamespace(someOperation[wsdl.ns['wsdl']+'output']['message']),
      };
    });
  });
  //console.log("PortTypes:", wsdl.portTypes);
  //console.log("");
};


/******************************************
<wsdl:binding name="ServiceSoap" type="tns:ServiceSoap">
  <soap:binding transport="http://schemas.xmlsoap.org/soap/http"/>
  <http:binding verb="GET" />
  <wsdl:operation name="SomeOperationName">
    <soap:operation soapAction="http://blahblah.com/blah/blah" style="document"/>
      <wsdl:input>
        <soap:body use="literal"/>
      </wsdl:input>
      <wsdl:output>
        <soap:body use="literal"/>
      </wsdl:output>
******************************************/
function processBindings(json) {
  var wsdlDefinitions = json[wsdl.ns['wsdl']+'definitions'];
  var wsdlBindings = wsdlDefinitions[wsdl.ns['wsdl']+'binding'];
  if (!(wsdlBindings instanceof Array)) wsdlBindings = [wsdlBindings];
  wsdlBindings.forEach(function(someBinding) {
    // First up, find the wsdl service this binding relates to
    var thisService;
    for (someService in wsdl.services) {
      if (stripNamespace(wsdl.services[someService].binding) == someBinding.name) {
        thisService = wsdl.services[someService];
        thisService['operations'] = {}

        // Now process each operation
        var wsdlOperations = someBinding[wsdl.ns['wsdl']+'operation'];
        if (!(wsdlOperations instanceof Array)) wsdlOperations = [wsdlOperations];
        wsdlOperations.forEach(function(someOperation) {
          if (someOperation.hasOwnProperty(wsdl.ns['soap']+'operation')) {
            var portType = wsdl.portTypes[stripNamespace(someBinding.type)][someOperation.name];

            var b_in = wsdl.messages[portType.input][0];
            var b_out = wsdl.messages[portType.output][0];
            //var b_in = portType.input;
            //var b_out = portType.output;

            var b_request = (wsdl.elements[b_in]) ? wsdl.elements[b_in]['propertyType'] : b_in
            var b_response = (wsdl.elements[b_out]) ? wsdl.elements[b_out]['propertyType'] : b_out

            //console.log(b_in)
            //if (!b_in.endsWith('Request')) b_in += 'Request';
            //if (!b_out.endsWith('Response')) b_out += 'Response';

            if (!classes2gen['request'][b_request]) {
              classes2gen['request'][b_request] = classes2gen['type'][b_request]
              delete classes2gen['type'][b_request]
            }

            if (!classes2gen['result'][b_response]) {
              classes2gen['result'][b_response] = classes2gen['type'][b_response]
              delete classes2gen['type'][b_response]
            }

            wsdl.bindings[someOperation.name] = {
              soapAction: someOperation[wsdl.ns['soap']+'operation'].soapAction,
              input: b_in,
              output: b_out,
              request: b_request,
              response: b_response,
            };
            // Link the operation back to the service
            thisService['operations'][someOperation.name] = wsdl.bindings[someOperation.name];
          }
        });
      }
    };
  });
  // Remove the placeholders now we've linked bindings to services
  for (var someService in wsdl.services) {
    delete wsdl.services[someService].binding;
  }
  //console.log("Bindings:",wsdl. bindings);
  //console.log("");
};


/******************************************
<wsdl:types>
  <s:schema elementFormDefault="qualified" targetNamespace="http://blahblah.com/blah/">
    <s:import namespace="http://microsoft.com/wsdl/types/" />
    <s:element name="SomeElementName">
      <s:complexType>
        <s:sequence>
          <s:element minOccurs="0" maxOccurs="1" name="AnotherElementName" type="tns:ScriptDetailsResponse"/>
        </s:sequence>
      </s:complexType>
    </s:element>
    <s:complexType name="SomeComplexTypeName">
      <s:sequence>
        <s:element minOccurs="0" maxOccurs="1" name="AnotherElementName" type="s:string"/>
      </s:sequence>
    </s:complexType>
    <s:simpleType name="SomeSimpleTypeName">
      <s:restriction base="s:string">
        <s:pattern value="[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"/>
      </s:restriction>
******************************************/
function processTypes(json) {
  var xsdSchemas = json[wsdl.ns['wsdl']+'definitions'][wsdl.ns['wsdl']+'types'][wsdl.ns['xsd']+'schema'];
  if (!(xsdSchemas instanceof Array)) xsdSchemas = [xsdSchemas];
  xsdSchemas.forEach(function(thisSchema) {
    // TODO handle the import - or not, as people don't seem to use this feature...
    //
    var elements = thisSchema[wsdl.ns['xsd']+'element'];
    if (elements != null) {
      if (!(elements instanceof Array)) elements = [elements];
      elements.forEach(function(someElement) {
        wsdl.elements[someElement.name] = someElement;
      });
    }

    var complexTypes = thisSchema[wsdl.ns['xsd']+'complexType'];
    if (complexTypes != null) {
      if (!(complexTypes instanceof Array)) complexTypes = [complexTypes];
      complexTypes.forEach(function(someComplexType) {
        wsdl.complexTypes[someComplexType.name] = someComplexType;
      });
    }

    var simpleTypes = thisSchema[wsdl.ns['xsd']+'simpleType'];
    if (simpleTypes != null) {
      if (!(simpleTypes instanceof Array)) simpleTypes = [simpleTypes];
      simpleTypes.forEach(function(someSimpleType) {
        wsdl.simpleTypes[someSimpleType.name] = someSimpleType;
      });
    }
  });
  for (var someElementName in wsdl.elements) {
    var someElement = wsdl.elements[someElementName];
    var propertyDefinition = propertyModelElement(someElement);
    var firstPDefKey = Object.keys(propertyDefinition)[0]
    //createClass(someElement.name, "Element", propertyDefinition);
    someElement['propertyType'] = propertyDefinition[firstPDefKey]['type']
  };
  for (var someComplexTypeName in wsdl.complexTypes) {
    var someComplexType = wsdl.complexTypes[someComplexTypeName];
    var propertyDefinition = propertyModelElement(someComplexType);
    //createClass(someComplexType.name, "Type", propertyDefinition);
    someComplexType['propertyDefinition'] = propertyDefinition
    classes2gen['type'][someComplexTypeName] = someComplexType
  };
  for (var someSimpleTypeName in wsdl.simpleTypes) {
    var someSimpleType = wsdl.simpleTypes[someSimpleTypeName];
    var propertyDefinition = propertyModelElement(someSimpleType);
    //createClass(someSimpleType.name, "Type", propertyDefinition);
    someSimpleType['propertyDefinition'] = propertyDefinition
    classes2gen['type'][someSimpleTypeName] = someSimpleType
  };
};

// Convert from XSD to propertyModeler
function propertyModelElement(json) {
  var propertyDefinition = { };
  if (json.hasOwnProperty(wsdl.ns['xsd']+"complexType")) {
    json = json[wsdl.ns['xsd']+'complexType'];
  }
  if (json.hasOwnProperty(wsdl.ns['xsd']+"complexContent")) {
    json = json[wsdl.ns['xsd']+'complexContent'];
  }
  if (json.hasOwnProperty(wsdl.ns['xsd']+"extension")) {
    json = json[wsdl.ns['xsd']+'extension'];
    var parent = stripNamespace(json.base);
    if (wsdl.elements.hasOwnProperty(parent)) {
      parent = wsdl.elements[parent];
    } else if (wsdl.complexTypes.hasOwnProperty(parent)) {
      parent = wsdl.complexTypes[parent];
    } else if (wsdl.simpleTypes.hasOwnProperty(parent)) {
      parent = wsdl.simpleTypes[parent];
    } else {
      console.log("Couldn't find extension by name:", parent);
      parent = null;
    }
    if (parent != null) {
      extendProperty(propertyDefinition, propertyModelElement(parent));
    }
  }
  if (json.hasOwnProperty(wsdl.ns['xsd']+"sequence")) {
    json = json[wsdl.ns['xsd']+'sequence'];
  }
  if (json.hasOwnProperty(wsdl.ns['xsd']+"choice")) {
    json = json[wsdl.ns['xsd']+'choice'];
  }
  if (json.hasOwnProperty(wsdl.ns['xsd']+"element")) {
    json = json[wsdl.ns['xsd']+'element'];
  }
  if (json != null) {
    if (!(json instanceof Array)) json = [json];
    for (var i=0; i<json.length; i++) {
      var wsdlProperty = json[i];
      // Set default type?
      if (!wsdlProperty.hasOwnProperty("type")) wsdlProperty.type = wsdl.ns['xsd']+"string";
      var newType = "";
      if (typeMap.hasOwnProperty(wsdlProperty.type)) {
        newType = typeMap[wsdlProperty.type];
      } else {
        //newType = "Type"+stripNamespace(wsdlProperty.type);
        newType = stripNamespace(wsdlProperty.type);
      }

      //
      // Build the PropertyModeler property definition
      //
      propertyDefinition[wsdlProperty.name] = {
        type: newType,
        wsdlDefinition: wsdlProperty,
        mask: Modeler.GET | Modeler.SET,
        required: (parseInt(wsdlProperty.minOccurs)>0)
      };
      //propertyDefinition[wsdlProperty.name].wsdlDefinition.type = newType;

      if ((parseInt(wsdlProperty.maxOccurs)>1 || (wsdlProperty.maxOccurs=="unbounded")) &&
          (!newType.match(/ArrayOf/)) ) {
        propertyDefinition[wsdlProperty.name].mask |= Modeler.ARRAY;
      }
      if (wsdlProperty.nillable) {
        propertyDefinition[wsdlProperty.name].required = false;
      }
      // ...
      };
  } else {
    console.error("Uhhh... Whats this?!", JSON.stringify(json, null, 2));
    propertyDefinition.dummy = { };
  };

  return propertyDefinition;
};


function extendProperty(a, b) {
  for (var property in b) {
    a[property] = b[property];
  }
};

// ----

function arrayUnique(a) {
    return a.reduce(function(p, c) {
        if (p.indexOf(c) < 0) p.push(c);
        return p;
    }, []);
};

function type2code(pd) {
  //console.log(dump(t)+"\n")

  var type = pd["type"]

  if (wsdl.simpleTypes[type]) {
    var st = wsdl.simpleTypes[type]
    type = st.propertyDefinition[type].type
    delete st.propertyDefinition
    pd.wsdlDefinition = st
  }

  delete pd.type

  var required = pd["required"]
  delete pd.required

  type = type.replace("Type", "")
  var strong = true
  var isNative = false
  var ptr = true
  var namespace = ''

  if (config['typeMap'][type]) {
    type = config['typeMap'][type]
    isNative = true
    strong = false
  } else if (config['typeMapStrong'][type]) {
    type = config['typeMapStrong'][type]
    isNative = true
    strong = true
  }

  if (!strong) {
    ptr = false
  }

  var comment = ""

  if (pd.wsdlDefinition['xsd:simpleType']) {
    pd.wsdlDefinition['xsd:restriction'] = pd.wsdlDefinition['xsd:simpleType']['xsd:restriction']
    delete pd.wsdlDefinition['xsd:simpleType']
  }

  delete pd.wsdlDefinition.minOccurs
  delete pd.wsdlDefinition.name
  delete pd.wsdlDefinition.nillable



  if (Object.keys(pd.wsdlDefinition).length > 0) {

    if (pd.wsdlDefinition["xsd:restriction"] && Object.keys(pd.wsdlDefinition["xsd:restriction"]).length > 0) {
      if (pd.wsdlDefinition.type == pd.wsdlDefinition["xsd:restriction"]["base"]) {
        delete pd.wsdlDefinition["xsd:restriction"]["base"]
      }
      var xsd_enumeration = pd.wsdlDefinition["xsd:restriction"]["xsd:enumeration"]
      if (xsd_enumeration && xsd_enumeration.length > 0) {
        var enumeration = []
        for (var k in xsd_enumeration) {
          enumeration.push(xsd_enumeration[k]["value"])
        }
        comment += "enumeration: " + enumeration.join(" | ") + "\n"
        delete pd.wsdlDefinition["xsd:restriction"]["xsd:enumeration"]
      }
    }

    if (!(pd.wsdlDefinition.type.indexOf("xsd:") === 0)) {
      namespace = getNamespace(pd.wsdlDefinition.type)+':'
    }
    delete pd.wsdlDefinition.type

    if (pd.wsdlDefinition["xsd:restriction"] && Object.keys(pd.wsdlDefinition["xsd:restriction"]).length == 0) {
      delete pd.wsdlDefinition["xsd:restriction"]
    }

    if (Object.keys(pd.wsdlDefinition).length > 0) {
      comment += dump(pd.wsdlDefinition) + "\n"
    }
  }
  delete pd.wsdlDefinition

  if (pd.mask == 6) {
    delete pd.mask
  }

  if (Object.keys(pd).length > 0) { comment += dump(pd) + "\n" }
  if (required) { comment += "required: " + required + "\n"}


  if (!isNative) {
    type = config.classPrefix+type+"Type"
  }

  return {
    type: type,
    upperCaseType: type.toUpperCase(),
    strong: strong,
    ptr: ptr,
    required: required,
    native: isNative,
    //namespace: namespace,
    comment: comment
    }
}

function capitaliseFirstLetter(string)
{
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function lowercaseFirstLetter(string)
{
    return string.charAt(0).toLowerCase() + string.slice(1);
}


function dump(o, dump) {
  dump = typeof dump !== 'undefined' ? dump : false;

  var cache = [];
  var s = JSON.stringify(o, function(key, value) {
      if (typeof value === 'object' && value !== null) {
          if (cache.indexOf(value) !== -1) {
              // Circular reference found, discard key
              return;
          }
          // Store value in our collection
          cache.push(value);
      }
      return value;
  }, 2);
  cache = null; // Enable garbage collection

  if (dump) {
    console.log(s)
  }
  return s
}

function initTemplate(name) {
  var tpl = {
    int: null,
    imp: null
  }

  if (config.intExt.length > 0) {
    try {
      var tplFile = fs.readFileSync(tplDir+name+config.intExt, 'utf8');
      tpl.int = Handlebars.compile(tplFile)
    } catch(e) { }
  }

  if (config.impExt.length > 0) {
    try {
      var tplFile = fs.readFileSync(tplDir+name+config.impExt, 'utf8');
      tpl.imp = Handlebars.compile(tplFile)
    } catch(e) { }
  }

  return tpl
}

function genClass(tpl, path, className, data) {
  if (tpl.int) {
    var fileName = outputDir+path+className+config.intExt
    try {
      fs.unlinkSync(fileName, 10000);
    } catch(e) { }
    fs.writeFile(fileName, tpl.int(data));
  }

  if (tpl.imp) {
    var fileName = outputDir+path+className+config.impExt
    try {
      fs.unlinkSync(fileName, 10000);
    } catch(e) { }
    fs.writeFile(fileName, tpl.imp(data));
  }
}

function genClasses() {

  outputDir = process.cwd()+"/"+outputDir+'/';

  try {
    fs.mkdirSync(outputDir);
  } catch(e) { }

  genServiceClasses()
  genTypeClasses()
  genRequestClasses()
  genResultClasses()
}

function genServiceClasses() {
  var classSuffix = 'Service'
  var tpl = initTemplate(classSuffix)

  var xmlns = []

  for (var key in wsdl.xmlns) {
    xmlns.push({name: key, url: wsdl.xmlns[key]})
  }

  for (var key in wsdl.services) {
    var className = config.classPrefix+key+classSuffix

    var service = wsdl.services[key]
    data = {
      config: config,
      name: key,
      namespace: service.namespace,
      //namespace: namespace,
      serviceUrl: service.serviceUrl,
      xmlns: xmlns,
      includes:[],
      properties:[],
      operations:[]
    }

    for (var op_key in service['operations']) {
      var op = service['operations'][op_key]
      data.includes.push(capitaliseFirstLetter(op.request))
      data.includes.push(capitaliseFirstLetter(op.response))

      var rootName = lowercaseFirstLetter(op_key)
      var namespace = (classes2gen.namespaces[rootName]) ? classes2gen.namespaces[rootName]+':' : ''

      data.operations.push({
        name: op_key,
        inputElement: op.input,
        outputElement: op.output,
        namespace: namespace,
        request: op.request,
        response: op.response
      })

    }

    data.includes = arrayUnique(data.includes)
    data['numberOfProperties'] = data.properties.length;
    genClass(tpl, '', className, data)

    // end loop
  }

};

function genTypeClasses() {
  var classSuffix = 'Type'
  var tpl = initTemplate(classSuffix)
  var path = classSuffix+'s/'

  try {
    fs.mkdirSync(outputDir+path);
  } catch(e) { }

  for (var key in classes2gen['type']) {

    var typeClass = classes2gen['type'][key]
    var propertyDefinition = typeClass['propertyDefinition']

    if (wsdl.simpleTypes[key]) {
      continue
    }

    var className = config.classPrefix+key+classSuffix
    var rootName = lowercaseFirstLetter(key)
    var namespace = (classes2gen.namespaces[rootName]) ? classes2gen.namespaces[rootName]+':' : ''

    //dump(classes2gen['type'][key], true)
    //console.log(className+' -> '+namespace)

    var data = {
      config: config,
      name: key,
      rootName: rootName,
      namespace: namespace,
      includes:[],
      properties:[]
    }

    for (var p_key in propertyDefinition) {
      var t = type2code(propertyDefinition[p_key])
      t['name'] = lowercaseFirstLetter(p_key)
      t['upperCaseName'] = capitaliseFirstLetter(p_key)
      t['namespace'] = namespace

      data.properties.push(t)
      if (!t.native) {
        data.includes.push(t.type)
      }
    }

    data.includes = arrayUnique(data.includes)
    data['numberOfProperties'] = data.properties.length
    genClass(tpl, path, className, data)

  }
}

function genRequestClasses() {
  var classSuffix = 'Request'
  var tpl = initTemplate(classSuffix)
  var path = classSuffix+'s/'

  try {
    fs.mkdirSync(outputDir+path);
  } catch(e) { }

  for (var key in classes2gen['request']) {
    var className = config.classPrefix+key

    var rootName = lowercaseFirstLetter(key)
    var namespace = (classes2gen.namespaces[rootName]) ? classes2gen.namespaces[rootName]+':' : ''

    var data = {
      config: config,
      name: key,
      rootName: rootName,
      namespace: namespace,
      includes:[],
      properties:[]
    }

    if (classes2gen['request'][key]) {
      var propertyDefinition = classes2gen['request'][key]['propertyDefinition']

      for (var p_key in propertyDefinition) {
        var t = type2code(propertyDefinition[p_key])
        t['name'] = lowercaseFirstLetter(p_key)
        t['upperCaseName'] = capitaliseFirstLetter(p_key)
        t['namespace'] = namespace

        data.properties.push(t)
        if (!t.native) {
          data.includes.push(t.type)
        }
      }
    } else {
      console.log("No property defs for "+key)
    }



    data.includes = arrayUnique(data.includes)
    data['numberOfProperties'] = data.properties.length
    genClass(tpl, path, className, data)

  }
}

function genResultClasses() {
  var classSuffix = 'Result'
  var tpl = initTemplate(classSuffix)
  var path = classSuffix+'s/'

  try {
    fs.mkdirSync(outputDir+path);
  } catch(e) { }

  for (var key in classes2gen['result']) {
    var className = config.classPrefix+key

    var data = {
      config: config,
      name: key,
      rootName: lowercaseFirstLetter(key),
      includes:[],
      properties:[]
    }

    if (classes2gen['result'][key]) {
      var propertyDefinition = classes2gen['result'][key]['propertyDefinition']

      for (var p_key in propertyDefinition) {
        var t = type2code(propertyDefinition[p_key])
        t['name'] = lowercaseFirstLetter(p_key)
        t['upperCaseName'] = capitaliseFirstLetter(p_key)

        data.properties.push(t)
        if (!t.native) {
          data.includes.push(t.type)
        }
      }
    } else {
      console.log("No property defs for "+key)
    }


    data.includes = arrayUnique(data.includes)
    data['numberOfProperties'] = data.properties.length
    genClass(tpl, path, className, data)

  }
}
