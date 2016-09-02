(function () {
    var chart;
    var range = ['Mon Jun 29 2009 22:25:18', 'Thu Jul 02 2009 22:11:19'];
    // The data that have been used for this sample can be taken from the CDN
    // http://cdn.anychart.com/csv-data/orcl-intraday.js
    var orcl_intraday_data = get_orcl_intraday_data();
    var text_doc = document.documentElement.innerHTML;
    var date_time_pattern = [
        "MMMM dd",
        "MMMM yyyy",
        "EEEE MMMM dd yyyy",
        "dddd MMMM dd yyyy h:mm:ss tt",
        "Q",
        "M",
        "L",
        "d",
        "h",
        "H",
        "E",
        "c",
        "w",
        "k",
        "K",
        "z",
        "Z",
        "v",
        "V",
        "yyyy.MM.dd G 'at' HH:mm:ss z",
        "EEE, MMM d, ''yy",
        "h:mm a",
        "hh 'o''clock' a, zzzz",
        "K:mm a, z",
        "yyyyy.MMMMM.dd GGG hh:mm aaa",
        "EEE, d MMM yyyy HH:mm:ss Z",
        "yyMMddHHmmssZ",
        "yyyy-MM-dd'T'HH:mm:ss.SSSZ",
        "yyyy-MM-dd'T'HH:mm:ss.SSSXXX",
        "YYYY-'W'ww-u"
    ];

    function hidePreloader() {
        $('#loader-wrapper').fadeOut('slow');
    }

    function activeEl(el) {
        $(el).closest('table').find('td').removeClass('active');
        $(el).addClass('active');
    }

    function getLocaleText() {
        $.ajax({
            url: 'http://cdn.anychart.com/locale/1.1.0/index.json',
            success: function (json) {
                var data = json;
                var $table = $('.language-locale').find('tbody');
                var locale;

                for (var i = 0; i < data['anychart-locales'].locales.length; i++) {
                    locale = data['anychart-locales'].locales[i];
                    $table.append(
                        '<tr>' + '<td data-locale-src="' + locale.url +
                        '" data-code="' + locale.code +
                        '">' + locale.englishName + ' - ' + locale.nativeName +
                        '</td>' + '</tr>'
                    )
                }

                askEventLanguageLocale();
            }
        });
    }

    function getDateTimePattern() {
        var $table = $('.date-pattern').find('tbody');

        for (var i = 0; i < date_time_pattern.length; i++) {
            $table.append(
                '<tr>' + '<td>' + date_time_pattern[i] + '</td>' + '</tr>'
            );
        }

        askEventDatePattern();
    }

    function loadScript(url, callback, code) {
        var body = $('body')[0];
        var script = document.createElement('script');
        var el = 'script[src="' + url + '"]';
        script.src = url;

        script.onload = callback(code);

        if ($(el).length == 0) {
            body.appendChild(script);
        }

        displayLocaleJSON(url);
        displayFullSource(url);
    }

    function displayLocaleJSON(url) {
        $.ajax({
            url: url,
            success: function (source) {
                var code = JSON.stringify(eval(source), null, '\t');
                var $lang_json = $('.language-json');

                $lang_json.text(code);
                Prism.highlightElement($lang_json[0]);
            }
        });
    }

    function displayFullSource(url) {
        var $lang_mark = $('.language-markup');
        var new_text_doc = text_doc.substr(0, text_doc.indexOf('</body>'));

        if (new_text_doc.indexOf(url) == -1) {
            new_text_doc += '\n\n';
            new_text_doc += '<script src="' + url + '">' + '</script>' + '\n</body>';
        }

        $lang_mark.text(new_text_doc);
        Prism.highlightElement($lang_mark[0]);
    }

    function disposeChart() {
        if (chart) {
            chart.dispose();
            chart = null;
        }
    }

    function changeLocale(code) {

        if (typeof code === 'string') {
            if (anychart.format.outputLocale() != code) {
                var timerId = setInterval(reDrawChart, 50);
            }
        }

        function reDrawChart() {
            if (window['anychart']['format']['locales'][code] != undefined) {
                var format = $('.date-pattern').find('td.active').text();
                clearInterval(timerId);
                disposeChart();
                createDailyChart(orcl_intraday_data, 'intraday-chart', code, format);
            }
        }
    }

    function changeDatePattern(format) {
        var locale = anychart.format.outputLocale();
        disposeChart();
        createDailyChart(orcl_intraday_data, 'intraday-chart', locale, format);
    }

    function askEventLanguageLocale() {
        $('.language-locale').find('td').on('click', function () {
            var $that = $(this);
            var url = $that.attr('data-locale-src');
            var code = $that.attr('data-code');

            loadScript(url, changeLocale, code);
            activeEl($that);
        }).first().trigger('click');
    }

    function askEventDatePattern() {
        $('.date-pattern').find('td').on('click', function () {
            var $that = $(this);

            activeEl($that);
            changeDatePattern($that.text());
        });
    }

    function createDailyChart(data, container, locale, format) {
        var date_format = 'EEEE, dd MMMM yyyy - hh:mm';
        if (format) {
            date_format = format;
        }
        // Set a localization for output.
        anychart.format.outputLocale(locale);
        // create data table on loaded data
        var dataTable = anychart.data.table();
        dataTable.addData(data);

        // map loaded data
        var closeMapping = dataTable.mapAs({'value': 4});
        var volumeMapping = dataTable.mapAs({'value': 5, 'type': 'average'});

        // create stock chart
        chart = anychart.stock();
        chart.title().enabled(true).text('ORCL Intraday data');
        chart.padding().left('70px');

        // create value plot on the chart
        var valuePlot = chart.plot(0);
        valuePlot.line(closeMapping).name("Close");
        valuePlot.grid().enabled(true);
        valuePlot.minorGrid().enabled(true);
        valuePlot.legend().titleFormatter(function () {
            return anychart.format.dateTime(this.value, date_format, null, locale);
        });
        valuePlot.legend().itemsTextFormatter(function () {
            return anychart.format.number(this.value, locale);
        });
        valuePlot.yAxis().labels().textFormatter(function () {
            return anychart.format.number(this.value, locale);
        });

        // create volume plot on the chart
        var volumePlot = chart.plot(1);
        volumePlot.column(volumeMapping).name("Volume");
        volumePlot.height('30%');
        volumePlot.legend().titleFormatter(function () {
            return anychart.format.dateTime(this.value, date_format, null, locale);
        });
        volumePlot.legend().itemsTextFormatter(function () {
            return anychart.format.number(this.value, locale);
        });
        volumePlot.yAxis().labels().textFormatter(function () {
            return anychart.format.number(this.value, locale);
        });

        chart.tooltip().titleFormatter(function () {
            return anychart.format.dateTime(this.hoveredDate, 'dd/MM/yy - hh:mm', null, locale);
        });

        chart.tooltip().textFormatter(function () {
            return 'Close: ' + anychart.format.number(eval(this.formattedValues[0]), locale) + '\n' +
                'Volume: ' + anychart.format.number(eval(this.formattedValues[1]), locale);
        });

        // create scroller series with mapped data
        chart.scroller().line(closeMapping);

        if (typeof range[0] === 'string' && typeof range[1] === 'string') {
            range[0] = new Date(range[0]).getTime();
            range[1] = new Date(range[1]).getTime();
        }

        // Sets values for selected range.
        chart.selectRange(range[0], range[1]);

        // set container id for the chart
        chart.container(container);

        // initiate chart drawing
        chart.draw();

        chart.listen("selectedrangechange", function (value) {
            range[0] = value.firstSelected;
            range[1] = value.lastSelected;
        });
    }

    anychart.onDocumentReady(function () {
        // event
        $('.tabs-control a').click(function (e) {
            e.preventDefault();
            $(this).tab('show');
        });

        getDateTimePattern();
        getLocaleText();
    });

    $(window).on('load', function () {
        //  hidePreloader();
    });

})();
