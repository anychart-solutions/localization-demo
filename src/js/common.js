(function () {
    var chart;
    var range = ['Mon Jun 29 2009 22:25:18', 'Thu Jul 02 2009 22:11:19'];
    // The data that have been used for this sample can be taken from the CDN
    // http://cdn.anychart.com/csv-data/orcl-intraday.js
    var orcl_intraday_data = get_orcl_intraday_data();
    var product = $('body').data('product');
    var chart_container = 'intraday-chart';
    var $date_pattern = $('.date-pattern');
    var default_format = 'EEEE, dd MMMM yyyy';
    var timeZoneOffset = new Date().getTimezoneOffset();
    formats = {};

    function hidePreloader() {
        $('#loader-wrapper').fadeOut('slow', function () {
            scrollPosition();
        });
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

                data['anychart-locales'].locales.sort(function (a, b) {
                    return a['englishName'].localeCompare(b['englishName']);
                });

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
                $table.find('td[data-code="en-us"]').trigger('click');
            }
        });
    }

    function getDateTimePattern(code) {
        var url = 'formats/' + code + '.js';

        loadScript(url, changePattern, code);
    }

    function changePattern(code) {
        var $table = $date_pattern.find('tbody');
        $table.empty();

        for (var i = 0; i < formats[code].length; i++) {
            $table.append(
                '<tr>' + '<td>' + formats[code][i] + '</td>' + '</tr>'
            );
        }

        askEventDatePattern();
    }

    function loadScript(url, callback, code) {
        var $body = $('body');
        var script = document.createElement('script');
        var el = 'script[src="' + url + '"]';

        script.src = url;

        if ($(el).length === 0) {
            $(script).attr('defer', 'defer');
            $body.find('#js_common').before(script);
        }
        script.onload = callback(code);

        displayLocaleJSON(url);
        displayFormatArray(url, code);
        displayFullSource(code);
    }

    function displayLocaleJSON(url) {
        if (url.indexOf('formats') === -1) {
            $.ajax({
                url: url,
                success: function (source) {
                    var code = JSON.stringify(eval(source), null, '\t');
                    var $lang_json = $('#locale-json').find('.language-json');

                    $lang_json.text(code);
                    Prism.highlightElement($lang_json[0]);
                }
            });
        }
    }

    function displayFormatArray(url, code) {
        if (url.indexOf('formats') !== -1) {
            var $lang_js = $('#format-array').find('.language-javascript');
            var text = 'var formats = {};\n' + 'formats' + '[\'' + code + '\'] = ';
            var formats_text = formats[code].map(function (value, index) {
                if (index == 0) {
                    return '"' + value + '"'
                }
                return '\t\t\t\t\t"' + value + '"'
            });

            $lang_js.text(text + '[' + formats_text.join(',\n') + ']');
            Prism.highlightElement($lang_js[0]);
        }
    }

    function displayFullSource(locale, input_format) {
        var $lang_mark = $('.language-markup');
        var format = input_format || $date_pattern.find('td.active').text() || default_format;
        var code_func = createChart.toString()
            .replace('function createChart(data, container, locale, format) {', '')
            .replace(/}$/, '')
            .trim();
        var code = 'anychart.onDocumentReady(function () {\n\t\tvar format ="' + format + '";\n\t\t' +
            'var locale = "' + locale + '";\n\t\t' +
            'var data = get_orcl_intraday_data();\n\t\t' +
            'var timeZoneOffset = new Date().getTimezoneOffset();\n\t\t' +
            'var range = [\'Mon Jun 29 2009 22:25:18\', \'Thu Jul 02 2009 22:11:19\'];\n\t\t' +
            code_func + '\n\t\t});';
        var doc = '<!DOCTYPE html>\n<html lang="en">\n<head>' +
            '\n\t<meta charset="utf-8" />' +
            '\n\t<script src="https://cdn.anychart.com/js/7.14.3/anychart-bundle.min.js"></script>' +
            '\n\t<script src="http://cdn.anychart.com/csv-data/orcl-intraday.js"></script>' +
            '\n\t<script src="' + 'https://cdn.anychart.com/locale/1.1.0/' + locale + '.js"></script>' +
            '\n</head>\n<body>' +
            '\n\t<div id="container" style="width: 850px; height: 600px; margin: 0 auto;"></div>' +
            '\n\t<script>\n\t\t' + code +
            '\n\t</script>\n</body>\n</html>';

        $lang_mark.text(doc);
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
                var format = $date_pattern.find('td.active').text() || default_format;

                clearInterval(timerId);
                disposeChart();
                createChart(orcl_intraday_data, chart_container, code, format);
            }
        }
    }

    function changeDatePattern(format, flag) {
        var locale = anychart.format.outputLocale();

        disposeChart();
        createChart(orcl_intraday_data, chart_container, locale, format);
        changeInputFormat(format, flag);
        displayFullSource(locale, format);
    }

    function askEventLanguageLocale() {
        $('.language-locale').find('td').on('click', function () {
            var $that = $(this);
            var url = $that.attr('data-locale-src');
            var code = $that.attr('data-code');

            loadScript(url, changeLocale, code);
            getDateTimePattern(code);
            activeEl($that);
        });
    }

    function askEventDatePattern() {
        $date_pattern.find('td').on('click', function () {
            var $that = $(this);

            activeEl($that);
            changeInputPattern($that.text());
            changeDatePattern($that.text());
        });
    }

    function changeInputPattern(pattern) {
        $('.format-pattern-input').val(pattern);
    }

    function changeInputFormat(format, flag) {
        var locale = anychart.format.outputLocale();
        var date = new Date();
        var pattern = anychart.format.dateTime(date, format, timeZoneOffset, locale);

        if (flag === undefined) {
            $('.format-input').val(pattern);
        } else {
            $('#custom-example-format-input').val(pattern)
        }
    }

    function createChart(data, container, locale, format) {
        // Set a localization for output.
        anychart.format.outputLocale(locale);
        // create data table on loaded data
        var dataTable = anychart.data.table();
        dataTable.addData(data);
        var _title = 'ORACLE Intraday\n' + 'From: ' +
            anychart.format.dateTime(data[0][0], format, timeZoneOffset, locale) +
            '\nTo: ' + anychart.format.dateTime(data[data.length - 1][0], format, timeZoneOffset, locale);

        // map loaded data
        var closeMapping = dataTable.mapAs({'open': 1, 'high': 2, 'low': 3, 'close': 4});
        var volumeMapping = dataTable.mapAs({'value': 5, 'type': 'average'});

        // create stock chart
        chart = anychart.stock();
        chart.padding().left('70px');
        chart.padding().top('20px');
        // set chart title text settings
        chart.title(_title).padding([20, 0, 10, 0]);

        // create value plot on the chart
        var ohlcPlot = chart.plot(0);
        var ohlcSeries = ohlcPlot.ohlc(closeMapping).name("ORACLE Intraday");
        ohlcPlot.grid().enabled(true);
        ohlcPlot.minorGrid().enabled(true);
        ohlcPlot.legend().itemsFormat(function () {
            return 'O: ' + anychart.format.number(this.open, locale) + '; ' +
                'H: ' + anychart.format.number(this.high, locale) + '; ' +
                'L: ' + anychart.format.number(this.low, locale) + '; ' +
                'C: ' + anychart.format.number(this.close, locale);
        });
        ohlcSeries.tooltip().format(function () {
            return 'Open: ' + anychart.format.number(this.open, locale) + '\n' +
                'High: ' + anychart.format.number(this.high, locale) + '\n' +
                'Low: ' + anychart.format.number(this.low, locale) + '\n' +
                'Close: ' + anychart.format.number(this.close, locale);
        });

        // create volume plot on the chart
        var volumePlot = chart.plot(1);
        var volumeSeries = volumePlot.column(volumeMapping).name("Volume");
        volumePlot.height('30%');
        volumePlot.legend().itemsFormat(function () {
            return anychart.format.number(this.value, locale);
        });
        volumeSeries.tooltip().format(function () {
            return 'Volume: ' + anychart.format.number(this.value, locale);
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

        $('#custom-format').find('.format-pattern-input').on('keyup', function () {
            changeDatePattern($(this).val(), true);
        });

        getLocaleText();
    });

    $(window).on('load', function () {
        hidePreloader();
    });

    function scrollPosition() {
        var $language_locale = $('.language-locale');
        var top = $language_locale.find('.active').position().top -
            $language_locale.height() / 2 + $language_locale.find('.active').height() / 2;

        $language_locale.animate({
            scrollTop: top
        }, 500);
    }

    /* Prism copy to clipbaord */
    $('pre.copytoclipboard').each(function () {
        $this = $(this);
        $button = $('<button></button>');
        $this.wrap('<div/>').removeClass('copytoclipboard');
        $wrapper = $this.parent();
        $wrapper.addClass('copytoclipboard-wrapper').css({position: 'relative'});
        $button.css({
            position: 'absolute',
            top: 10,
            right: 27,
            width: 55,
            height: 31
        }).appendTo($wrapper).addClass('copytoclipboard btn btn-default');

        var copyCode = new Clipboard('button.copytoclipboard', {
            target: function (trigger) {
                return trigger.previousElementSibling;
            }
        });
        copyCode.on('success', function (event) {
            event.clearSelection();
            $(event.trigger).addClass('copied');
            window.setTimeout(function () {
                $(event.trigger).removeClass('copied');
            }, 2000);
        });
        copyCode.on('error', function (event) {
            event.trigger.textContent = 'Press "Ctrl + C" to copy';
            window.setTimeout(function () {
                event.trigger.textContent = 'Copy';
            }, 2000);
        });
    });
})();
