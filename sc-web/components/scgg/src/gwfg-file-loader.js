GwfgFileLoader = {
    load: function (args) {
        var reader = new FileReader();
        var is_file_correct;

        reader.onload = function (e) {
            var text = e.target.result;
//          text = text.replace("windows-1251","utf-8");

            is_file_correct = GwfgObjectInfoReader.read(text.replace(
                "<?xml version=\"1.0\" encoding=\"windows-1251\"?>",
                "<?xml version=\"1.0\" encoding=\"utf-8\"?>"
            ));
        };

        reader.onloadend = function (e) {
            if (is_file_correct != false) {
                SCggObjectBuilder.buildObjects(GwfgObjectInfoReader.objects_info);
                args["render"].update();
            } else
                GwfgObjectInfoReader.printErrors();
        };

//      reader.readAsText(args["file"], "CP1251");
        reader.readAsText(args["file"]);
        return true;
    }

};
