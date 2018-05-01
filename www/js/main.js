// use when testing phone gap as will not get fired in browser
document.addEventListener("deviceready", setup, false);

var brightness = 0;
var fullBrightness = false;
var statusBarVisible = true;

var codeDict = {
    "CODE_128":"CODE128",
    "CODE_39":"CODE39",
    "EAN_8":"ean8",
    "EAN_13":"ean13",
    "UPC_A":"upc",
    "ITF":"itf14"
};

function setup() {
    initDb(function(){
        //success
        // alert(native);
        loadDataset();
    },function(err){
        //fail
        alert(err.message);
    });

    StatusBar.overlaysWebView(false);
    StatusBar.backgroundColorByHexString("#000");
    statusBarVisible = StatusBar.isVisible;
    // StatusBar.hide();

    //set onclick for closing barcode fullscreen image
    $("#barcodeviewimage").click(function(){
        setNormalBrightness();
        if(statusBarVisible){
            StatusBar.show();
        }
        window.history.back();

    });
    $("#addCode").on("swiperight",function(e){
        if (e.swipestart.coords[0] < 50) {
            $.mobile.changePage("#home",{
                transition: "slide",
                reverse: true
            });
        }
    });
}


function loadDataset(){
    var codelist = $("#codelist");
    codelist.empty();
    codes = getAllCodes(function(codes){
        //Successfully acquired code list
        for(var name in codes){//loop through each code
            //get code by name
            code = codes[name];
            //generate html
            var text = "<li class='barcodeitem' reference='" + name + "'>";
            text += "<a href='#'>";
            text += "<img />";
            text += "<h1>" + name + "</h1>";
            text += "<p>Code: " + code.code + "</p>";
            text += "<p>Type: " + code.type + "</p>";
            text += "</a>";
            text += "</li>";
            //add code to <ul>
            codelist.append(text);
            //set onclick to view barcode
            var barcodeitem = $(".barcodeitem");
            barcodeitem.click(function(){
                var $this = $(this);
                if($this.data("executing")){
                    return;
                }
                $this.data("executing",true);
                var name = $this.attr("reference");
                showBarcodeView(name,function(){
                    //success
                    $this.removeData("executing");
                },function(err){
                    //fail
                    $this.removeData("executing");
                    alert(err.message);
                });
            });
            barcodeitem.on("swipeleft",function(){
                //try delete
                var name = $(this).attr("reference");
                navigator.notification.confirm("Delete " + name + "?", function(result){
                    if(result === 1){
                        removeCode(name,function(){
                            //successfully removed
                            loadDataset();
                        },function(){
                            //failed to remove
                            alert("failed to remove");
                        })
                    }
                },"Delete","Yes,No");

            });
            //draw icon for code
            drawBarcodeIcon($(".barcodeitem[reference='" + name + "'] img:first"),code.code,code.type);
        }
    },function(err){
        alert(err.message);
    });
    codelist.listview("refresh");
}

function submitAddCodeForm(){
    alert("submit");
}

function drawBarcodeIcon(image,data,format){
    var img = new Image();
    JsBarcode(img,data,{
        format:format
    });
    img.onload = function(){
        image.attr("src",img.src);
    }
}

function setBrightness(val){
    if('brightness' in cordova.plugins){
        cordova.plugins.brightness.setBrightness(val, function(){
            //alert("success");
        }, function(){
            //alert("fail");
            alert("failed to set brightness to: " + val);
        });
    }else{
        //brightness not supported
        alert("brightness not supported");
    }
}
function setFullBrightness(){
    if('brightness' in cordova.plugins){
        //get current brightness
        cordova.plugins.brightness.getBrightness(
        function(status){//win
            if(!fullBrightness){
                brightness = status;
            }
            fullBrightness = true;
            setBrightness(1);
        },function(status){//fail
            alert("failed to get brightness");
        });

    }
}
function setNormalBrightness(){
    if('brightness' in cordova.plugins){
        //set normal brightness
        setBrightness(brightness);
        fullBrightness = false;
    }
}

function showBarcodeView(name,success,fail){
    getCode(name,function(code) {
        //Code Found
        var img = new Image();
        JsBarcode(img,code.code,{
            format:code.type,
            width: 8,
            height: 400,
            fontSize: 60,
            margin:100
        });
        img.onload = function(){
            StatusBar.hide();
            $("#barcodeviewimage").css("background-image","url('" + rotateImage(img).src + "')");
            $.mobile.navigate("#barcodeview");
            setFullBrightness();
            success();
        }
    },function(err){
        fail(err);
    });
}

function rotateImage(img){
    var canvas  = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    canvas.width = img.height;
    canvas.height = img.width;
    ctx.translate(img.height,0);
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(img,0,0);
    ctx.fill();
    var out = new Image();
    out.src=canvas.toDataURL();
    return out;
}

function scanBarcode(){
    if(typeof cordova.plugins.barcodeScanner == 'undefined'){
        alert("barcode scanner is not supported");
    }
    //https://www.jqueryscript.net/demo/Simple-jQuery-Based-Barcode-Generator-Barcode/
    cordova.plugins.barcodeScanner.scan(
        function (result) {
            if(!result.cancelled){
                if(result.format in codeDict){
                    // var obj = {
                    //     code:result.text,
                    //     type:codeDict[result.format]
                    // };
                    $("#addCodeForm-data").val(result.text);
                    $("#addCodeForm-type").val(codeDict[result.format]).selectmenu("refresh",true);
                    // $("#addCodeForm-type");
                    // setCode(result.text,obj,function(){
                    //     //Success
                    //     alert("Code Added");
                    //     loadDataset();
                    //     $.mobile.navigate("#home");
                    // },function(err){
                    //     //Fail
                    //     alert(err.message);
                    // });
                }else{
                    navigator.notification.alert(
                        'This code format is not supported yet \n' + result.format,
                        function(){},
                        'Error',
                        'OK'
                    );
                    $.mobile.navigate("#home");
                }
            }
        },
        function (error) {
            alert("Scanning failed: " + error);
        },
        {
            preferFrontCamera : false, // iOS and Android
            showFlipCameraButton : true, // iOS and Android
            showTorchButton : true, // iOS and Android
            torchOn: false, // Android, launch with the torch switched on (if available)
            saveHistory: true, // Android, save scan history (default false)
            prompt : "Place a barcode inside the scan area", // Android
            resultDisplayDuration: 0, // Android, display scanned text for X ms. 0 suppresses it entirely, default 1500
            disableAnimations : true, // iOS
            disableSuccessBeep: true // iOS and Android
        }
    );
}