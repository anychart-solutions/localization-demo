(function () {
    var chart;
    var product = $('body').data('product');
    var chart_container = 'server-status-chart';
    var data = serverStatusData();
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
            url: 'https://cdn.anychart.com/locale/1.1.0/index.json',
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
        var code = 'anychart.onDocumentReady(function () {\n\t\tvar format ="' + format + '";\n' +
            '\t\tvar locale = "' + locale + '";\n\t\t' +
            'var data = serverStatusData();\n\t\t' +
            'var timeZoneOffset = new Date().getTimezoneOffset();\n\t\t' +
            code_func + '\n\t\t});';
        var doc = '<!DOCTYPE html>\n<html lang="en">\n<head>' +
            '\n\t<meta charset="utf-8" />' +
            '\n\t<script src="https://cdn.anychart.com/js/7.14.3/anychart-bundle.min.js"></script>' +
            '\n\t<script src="' + 'https://cdn.anychart.com/locale/1.1.0/' + locale + '.js"></script>' +
            '\n\t<script src="http://anychart.com/products/anygantt/demos/localization/repo/data.js"></script>' +
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
                createChart(data, chart_container, code, format);
            }
        }
    }

    function changeDatePattern(format, flag) {
        var locale = anychart.format.outputLocale();

        disposeChart();
        createChart(data, chart_container, locale, format);
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
        // create data tree on our data
        var treeData = anychart.data.tree(data, anychart.enums.TreeFillingMethod.AS_TABLE);

        // set a localization for output
        anychart.format.outputLocale(locale);
        anychart.format.outputDateTimeFormat(format);

        // create project gantt chart
        chart = anychart.ganttResource();
        // set data for the chart
        chart.data(treeData);
        // set start splitter position settings
        chart.splitterPosition(110);

        // get chart data grid link to set column settings
        var dataGrid = chart.dataGrid();
        dataGrid.column(0).enabled(false);

        // set first column settings
        var firstColumn = dataGrid.column(1);
        firstColumn.title('Server');
        firstColumn.width(110);
        firstColumn.cellTextSettings().hAlign('left');
        firstColumn.format(function (item) {
            return item.get('name');
        });
        firstColumn.cellTextSettingsOverrider(labelTextSettingsOverrider);

        // set second column settings
        var secondColumn = dataGrid.column(2);
        secondColumn.title('Online');
        secondColumn.width(60);
        secondColumn.cellTextSettings().hAlign('right');
        secondColumn.format(function (item) {
            return item.get('online') || '';
        });
        secondColumn.cellTextSettingsOverrider(labelTextSettingsOverrider);

        // set third column settings
        var thirdColumn = dataGrid.column(3);
        thirdColumn.title('Maintenance');
        thirdColumn.width(60);
        thirdColumn.cellTextSettings().hAlign('right');
        thirdColumn.format(function (item) {
            return item.get('maintenance') || '';
        });
        thirdColumn.cellTextSettingsOverrider(labelTextSettingsOverrider);

        // set fourth column settings
        var fourthColumn = dataGrid.column(4);
        fourthColumn.title('Offline');
        fourthColumn.width(60);
        fourthColumn.cellTextSettings().hAlign('right');
        fourthColumn.format(function (item) {
            return item.get('offline') || '';
        });
        fourthColumn.cellTextSettingsOverrider(labelTextSettingsOverrider);

        // set container id for the chart
        chart.container(container);
        // initiate chart drawing
        chart.draw();

        function labelTextSettingsOverrider(label, item) {
            switch (item.get('type')) {
                case 'online':
                    label.fontColor('#70B7DD').fontWeight('bold');
                    break;
                case 'offline':
                    label.fontColor('#E24B26').fontWeight('bold');
                    break;
                case 'maintenance':
                    label.fontColor('#FFA500').fontWeight('bold');
                    break;
            }
        }
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
        placeBlocks();
        hidePreloader();
    });

    $(window).on('resize', function () {
        placeBlocks();
    });

    function scrollPosition() {
        var $language_locale = $('.language-locale');
        var top = $language_locale.find('.active').offset().top -
            $language_locale.height() / 2 + $language_locale.find('.active').height() / 2;

        $language_locale.animate({
            scrollTop: top
        }, 500);
    }

    function placeBlocks() {
        var mq = window.matchMedia('(max-width: 768px)');

        if (mq.matches) {
            $('.preview-container').detach().insertAfter('.tables-container');
        } else {
            $('.tables-container').detach().insertAfter('.preview-container');
        }
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