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
    $("#editview").on("swiperight",function(e){
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
    getCurrentLocation(function(location){
        codes = getAllCodes(function(codes){
            //add dists to codes
            for(var name in codes){
                code = codes[name];
                if (code.locationName){
                    var dist = distanceBetween(location, {
                        lat:code.lat,
                        lon:code.lon
                    });
                    code.distance = dist;
                }else{
                    code.distance = Infinity;
                }
            }
            //sort codes
            codes.sort(function(a,b){
                return a.distance - b.distance;
            });
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
                text += "<p>Dist: " + code.distance + "</p>";
                text += "</a><a href='#' data-icon='gear'></a>";
                text += "</li>";
                //add code to <ul>
                codelist.append(text);
                //set onclick to view barcode
                var barcodeitem = $(".barcodeitem");
                barcodeitem.each(function(){
                    var $listitem = $(this);
                    $listitem.children().first().click(function(){
                        var $this = $(this);
                        if($this.parent().data("executing")){
                            return;
                        }
                        $this.parent().data("executing",true);
                        var name = $this.parent().attr("reference");
                        showBarcodeView(name,function(){
                            //success
                            $this.parent().removeData("executing");
                        },function(err){
                            //fail
                            $this.parent().removeData("executing");
                            alert(err.message);
                        });
                    });
                    $listitem.children().eq(1).click(function(){
                        var $this = $(this);
                        if($this.parent().data("executing")){
                            return;
                        }
                        $this.parent().data("executing",true);
                        var name = $this.parent().attr("reference");
                        showEditView(name,function(){
                            //success
                            $this.parent().removeData("executing");
                        },function(err){
                            //fail
                            $this.parent().removeData("executing");
                            alert(err.message);
                        });
                    });
                });
                // barcodeitem.on("swipeleft",function(){
                //     //try delete
                //     var name = $(this).attr("reference");
                //     navigator.notification.confirm("Delete " + name + "?", function(result){
                //         if(result === 1){
                //             removeCode(name,function(){
                //                 //successfully removed
                //                 loadDataset();
                //             },function(){
                //                 //failed to remove
                //                 alert("failed to remove");
                //             })
                //         }
                //     },"Delete","Yes,No");
                //
                // });
                //draw icon for code
                drawBarcodeIcon($(".barcodeitem[reference='" + name + "'] img:first"),code.code,code.type);
            }
        },function(err){
            alert(err.message);
        });
        codelist.listview("refresh");
    },function(err){
        alert(err);
    });



}

function submitAddCodeForm(){
    // alert("submit");
    var name = $("#addCodeForm-name").val();
    var obj = {
        code:$("#addCodeForm-data").val(),
        type:$("#addCodeForm-type").val()
    };
    setCode(name,obj,function(){
        //Success
        // alert("Code Added");
        loadDataset();
        $.mobile.navigate("#home");
        $("#addCodeForm").trigger("reset");
    },function(err){
        //Fail
        alert(err.message);
    });
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
function showEditView(name,success,fail){
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
            $("#editviewtitle").text(name);
            $("#editLocationName").val(code.locationName);
            $("#editLocationLat").val(code.lat);
            $("#editLocationLon").val(code.lon);
            $("#editviewimage").attr("src",img.src);
            $.mobile.navigate("#editview");
            success();
        }
    },function(err){
        fail(err);
    });
}

function getCurrentLocation(success,fail){
    navigator.geolocation.getCurrentPosition(function(position){
        success({
            lat: position.coords.latitude,
            lon: position.coords.longitude
        });
    },function(error){
        fail(error);
    });
}

function distanceBetween(a,b){
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(b.lat-a.lat);  // deg2rad below
    var dLon = deg2rad(b.lon-a.lon);
    var _a =
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(a.lat)) * Math.cos(deg2rad(b.lat)) *
        Math.sin(dLon/2) * Math.sin(dLon/2)
    ;
    var c = 2 * Math.atan2(Math.sqrt(_a), Math.sqrt(1-_a));
    var d = R * c; // Distance in km
    return d * 1000; //in meters
}
function deg2rad(deg) {
    return deg * (Math.PI/180)
}

function initMap() {
    getCurrentLocation(function(position){
        var map = new google.maps.Map(document.getElementById('map'), {
            center: {lat: position.lat, lng: position.lon},
            zoom: 17
        });
        var input = document.getElementById('pac-input');
        var autocomplete = new google.maps.places.Autocomplete(input);
        autocomplete.bindTo('bounds', map);
        var infowindow = new google.maps.InfoWindow();
        var infowindowContent = document.getElementById('infowindow-content');
        infowindow.setContent(infowindowContent);
        var marker = new google.maps.Marker({
            map: map,
            anchorPoint: new google.maps.Point(0, -29)
        });
        autocomplete.addListener('place_changed', function() {
            infowindow.close();
            marker.setVisible(false);
            var place = autocomplete.getPlace();
            if (!place.geometry) {
                window.alert("No details available for input: '" + place.name + "'");
                return;
            }
            if (place.geometry.viewport) {
                map.fitBounds(place.geometry.viewport);
            } else {
                map.setCenter(place.geometry.location);
                map.setZoom(17);
            }
            // alert(place.geometry.location + "," + place.name);
            // var dist = distanceBetween({
            //     lat:place.geometry.location.lat(),
            //     lon:place.geometry.location.lng()
            // },position);
            // alert(dist);
            $("#editLocationName").val(place.name);
            $("#editLocationLat").val(place.geometry.location.lat());
            $("#editLocationLon").val(place.geometry.location.lng());
            marker.setPosition(place.geometry.location);
            marker.setVisible(true);
            var address = '';
            if (place.address_components) {
                address = [
                    (place.address_components[0] && place.address_components[0].short_name || ''),
                    (place.address_components[1] && place.address_components[1].short_name || ''),
                    (place.address_components[2] && place.address_components[2].short_name || '')
                ].join(' ');
            }
            infowindowContent.children['place-icon'].src = place.icon;
            infowindowContent.children['place-name'].textContent = place.name;
            infowindowContent.children['place-address'].textContent = address;
            infowindow.open(map, marker);
        });
    },function(error){
        alert(error);
    });

    // placesService = new google.maps.places.PlacesService(map);
    // map.addListener('click',function(event){
    //     alert(event.latLng);
    //     alert(event);
    //     if(event.placeId){
    //         // event.stop();
    //         placesService.getDetails({placeId: placeId}, function(place, status) {
    //             alert(status);
    //             if (status === 'OK') {
    //                 // me.infowindow.close();
    //                 // me.infowindow.setPosition(place.geometry.location);
    //                 // me.infowindowContent.children['place-icon'].src = place.icon;
    //                 // me.infowindowContent.children['place-name'].textContent = place.name;
    //                 // me.infowindowContent.children['place-id'].textContent = place.place_id;
    //                 // me.infowindowContent.children['place-address'].textContent =
    //                 //     place.formatted_address;
    //                 // me.infowindow.open(me.map);
    //                 alert(place.name);
    //             }
    //         });
    //
    //     }
    // });
}

function submitEditLocationForm(){
    var name = $("#editviewtitle").text();
    getCode(name,function(code) {
        code.locationName = $("#editLocationName").val();
        code.lat = $("#editLocationLat").val();
        code.lon = $("#editLocationLon").val();
        setCode(name,code,function(){
            //Success
            // alert("Code Added");
            loadDataset();
            $.mobile.navigate("#home");
            $("#editLocationForm").trigger("reset");
        },function(err){
            //Fail
            alert(err.message);
        });
    }, function(err){
        alert(err.message);
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
                    $("#addCodeForm-data").val(result.text);
                    $("#addCodeForm-type").val(codeDict[result.format]).selectmenu("refresh",true);
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