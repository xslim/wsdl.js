wsdl.js
=======

WSDL class generator


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

* `./wsdl.js -t ios -p ADY Payment.wsdl`

```
Processing Payment.wsdl
  output: out
  template: ios
  class prefix: ADY
```
