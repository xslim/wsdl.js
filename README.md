# wsdl.js

WSDL class generator

## Installation
* Use Node.JS 0.10+
* run `npm install`

## Usage

* `./wsdl.js`

```
  Usage: wsdl [options] <file>

  Options:

    -h, --help                output usage information
    -V, --version             output the version number
    -t, --template [name]     Use template [ios]
    -p, --prefix [prefix]     Class prefix to use
    -o, --output [directory]  Output to specified directory [out]
```

* `./wsdl.js -t ios -p ADYAPI Payment.wsdl`

```
Processing Payment.wsdl
  output: out
  template: ios
  class prefix: ADY
```

## Notes
* Based on `ivory`
