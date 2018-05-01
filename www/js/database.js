var dataset = {};
var native = false;
var DEFAULT_DATASET = {
    "Library":{
        code:"13485735",
        type:"CODE39"
    },
    "Morrisons":{
        code:"9826135802181250495",
        type:"CODE128"
    }
};
function initDb(success,fail){
    if(typeof NativeStorage == 'undefined'){
        alert("no native storage");
    }else{
        native = true;
    }

    if(native){
        NativeStorage.getItem("db",function(obj){
            dataset = obj;
            success();
        },function(err){
            // fail({message:"failed to load from native storage, loading default data"})
            dataset = DEFAULT_DATASET;
            saveDB(function(){
                // alert("loaded defaults");
                success();
            },function(err){
                fail({message:"failed to load defaults"});
            })
        });
    }else{
        //no native storage
        dataset = DEFAULT_DATASET;
        success();
    }
}
function saveDB(success,fail){
    NativeStorage.setItem("db",dataset,function(){
        //success
        success();
    },function(err){
        //fail
        fail({message:"failed to save data"});
    });
}
function getCode(name,success,fail){
    if(name in dataset){
        success(Object.assign({},dataset[name]));
    }else{
        fail({message:"Code not stored"});
    }
}
function getAllCodes(success,fail){
    success(Object.assign({},dataset));
}
function setCode(name,obj,success,fail){
    dataset[name] = obj;
    if(native){
        saveDB(function(){
            success();
        },function(err){
            fail(err);
        })
    }else{
        success();
    }
}
function removeCode(name,success,fail){
    if(name in dataset){
        delete dataset[name];
    }else{
        fail({message:"Code does not exist"});
    }
    if(native){
        saveDB(function(){
            //success
            success();
        },function(){
            //fail
            fail({message:"Failed to save"});
        });
    }else{
        success();
    }

}
function getCodeNames(success,fail){
    success(Object.keys(dataset));
}


