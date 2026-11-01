// Spotify plan billing bot: reminder engine (enviarCobrancasSpotify) and receipt engine (processarPagamento).
// Member names in criarFormularioMagico were replaced with placeholders. Everything else is the code in use.

function enviarCobrancasSpotify() {
  var aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Subscrições");
  var ultimaLinha = aba.getLastRow();
  
  if (ultimaLinha < 2) return; 
  
  // Lemos até à coluna F para apanhar tudo direitinho
  var dados = aba.getRange("A2:F" + ultimaLinha).getValues();
  
  // TRUQUE ANTI-FUSO HORÁRIO: Fixamos o "Hoje" ao MEIO-DIA
  var hoje = new Date();
  hoje.setHours(12,0,0,0); 
  
  for (var i = 0; i < dados.length; i++) {
    var linha = dados[i];
    
    var nome = linha[0];       
    var email = linha[1];      
    var validade = new Date(linha[3]); 
    var estado = linha[4];     
    
    if (!email || email === "" || !linha[3]) continue;
    
    // TRUQUE ANTI-FUSO HORÁRIO: Fixamos a "Validade" ao MEIO-DIA
    validade.setHours(12,0,0,0);
    
    var diffTempo = validade.getTime() - hoje.getTime();
    var diasParaExpirar = Math.round(diffTempo / (1000 * 3600 * 24));
  
    var enviarEmail = false;
    var assunto = "";
    var mensagemParagrafo1 = "";
    var mensagemParagrafo2 = "";
    var mensagemClausula = "";
    
    var dataFormatada = Utilities.formatDate(validade, Session.getScriptTimeZone(), "dd/MM/yyyy");
    
    var nomeMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    var dataTexto = validade.getDate() + " de " + nomeMeses[validade.getMonth()];
    
    if (diasParaExpirar === 7) {
      enviarEmail = true;
      assunto = "⏳ Aviso de Renovação: Spotify Premium";
      mensagemParagrafo1 = "Informamos que a tua subscrição de Spotify Premium expira dentro de uma semana, dia <b>" + dataTexto + "</b>.";
      mensagemParagrafo2 = "Para garantir a continuidade do teu acesso sem interrupções, por favor consulta a tabela abaixo e efetua o pagamento correspondente aos meses que desejas renovar.";
      mensagemClausula = "<p style='font-size: 14px; color: #555555; line-height: 1.5; margin-bottom: 25px;'><i>(Caso não pretendas manter a tua vaga ativa no próximo ciclo, agradeço que informes com a maior brevidade possível para efeitos de gestão).</i></p>";
    } 
    else if (diasParaExpirar === 0) {
      enviarEmail = true;
      assunto = "⚠️ Alerta: O teu Spotify Premium expira HOJE";
      mensagemParagrafo1 = "Informamos que a tua subscrição de Spotify Premium expira exatamente hoje, dia <b>" + dataTexto + "</b>.";
      mensagemParagrafo2 = "Para não perderes o acesso e garantires a continuidade sem interrupções, por favor consulta a tabela abaixo e efetua o pagamento correspondente aos meses que desejas renovar.";
      mensagemClausula = ""; 
    }
    else if (diasParaExpirar < 0 && Math.abs(diasParaExpirar) % 7 === 0) {
      enviarEmail = true;
      assunto = "❌ Spotify: Mensalidade em Atraso (" + Math.abs(diasParaExpirar) + " dias)";
      mensagemParagrafo1 = "Informamos que a tua subscrição de Spotify Premium expirou a <b>" + dataTexto + "</b> e encontra-se com o pagamento pendente.";
      mensagemParagrafo2 = "Para regularizar a situação e manteres a tua vaga ativa, por favor consulta a tabela abaixo e efetua o pagamento correspondente aos meses que desejas renovar.";
      mensagemClausula = ""; 
    }
    
    if (enviarEmail) {
      var linhasTabela = "";
      for (var m = 1; m <= 12; m++) {
        var valor = (m * 2.90).toFixed(2).replace('.', ',') + "€";
        var novaData = new Date(validade);
        novaData.setMonth(novaData.getMonth() + m);
        var novaDataFormatada = Utilities.formatDate(novaData, Session.getScriptTimeZone(), "dd/MM/yyyy");
        
        var corFundo = (m % 2 === 0) ? "#fafafa" : "#ffffff";
        
        linhasTabela += "<tr style='background-color: " + corFundo + ";'>" +
                        "<td style='padding: 12px 15px; border-bottom: 1px solid #eeeeee; color: #555555; text-align: left;'>" + m + "</td>" +
                        "<td style='padding: 12px 15px; border-bottom: 1px solid #eeeeee; font-weight: bold; color: #333333; text-align: left;'>" + valor + "</td>" +
                        "<td style='padding: 12px 15px; border-bottom: 1px solid #eeeeee; color: #555555; text-align: left;'>" + novaDataFormatada + "</td>" +
                        "</tr>";
      }
      
      var corpoDoEmail = 
        "<div style='background-color: #f4f4f5; padding: 30px 10px; font-family: \"Helvetica Neue\", Helvetica, Arial, sans-serif;'>" +
          "<div style='max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);'>" +
            "<div style='background-color: #1DB954; padding: 25px; text-align: center;'>" +
              "<img src='https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_White.png' width='130' height='auto' style='vertical-align: middle;' alt='Spotify Official Logo'>" +
            "</div>" +
            "<div style='padding: 30px;'>" +
              "<p style='font-size: 16px; color: #333333; margin-top: 0;'>Olá <b>" + nome + "</b>,</p>" +
              "<p style='font-size: 14px; color: #555555; line-height: 1.5;'>" + mensagemParagrafo1 + "</p>" +
              "<p style='font-size: 14px; color: #555555; line-height: 1.5; margin-bottom: 25px;'>" + mensagemParagrafo2 + "</p>" +
              mensagemClausula +
              "<div style='border: 1px solid #eeeeee; border-radius: 6px; overflow: hidden; margin-bottom: 30px; box-shadow: 0 2px 5px rgba(0,0,0,0.02);'>" +
                "<table style='width: 100%; border-collapse: collapse; font-size: 14px;'>" +
                  "<thead>" +
                    "<tr style='background-color: #1DB954; color: #ffffff;'>" +
                      "<th style='padding: 12px 15px; text-align: left; font-weight: bold;'>Meses</th>" +
                      "<th style='padding: 12px 15px; text-align: left; font-weight: bold;'>Valor</th>" +
                      "<th style='padding: 12px 15px; text-align: left; font-weight: bold;'>Validade</th>" +
                    "</tr>" +
                  "</thead>" +
                  "<tbody>" +
                    linhasTabela +
                  "</tbody>" +
                "</table>" +
              "</div>" +
              "<div style='background-color: #000000; border-top: 4px solid #EA0029; border-radius: 8px; padding: 20px 20px 30px 20px; text-align: center;'>" +
                "<div style='margin-bottom: 10px;'>" +
                  "<a href='#' style='cursor: default; pointer-events: none; text-decoration: none; display: inline-block;'>" +
                    "<img src='https://wsrv.nl/?url=https://iconape.com/wp-content/files/kk/209521/svg/209521.svg&w=400&output=png' width='175' style='width: 175px; max-width: 175px; height: auto; display: block; margin: 0 auto; border: 0;' alt='MB WAY'>" +
                  "</a>" +
                "</div>" +
                "<div>" +
                  "<a href='mbway://' style='background-color: #EA0029; color: #ffffff; text-decoration: none; padding: 14px 35px; border-radius: 8px; font-size: 16px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(234, 0, 41, 0.5);'>Efetuar Pagamento</a>" +
                "</div>" +
              "</div>" +
              "<p style='font-size: 14px; color: #555555; line-height: 1.5; margin-top: 25px; margin-bottom: 0;'>Obrigado e boas músicas! &#127911;</p>" +
              "<p style='font-size: 12px; color: #888888; margin-top: 30px; margin-bottom: 0; border-top: 1px solid #eeeeee; padding-top: 15px; line-height: 1.4;'>" +
                "Caso já tenhas efetuado o pagamento, por favor ignora este aviso automático." +
              "</p>" +
            "</div>" +
          "</div>" +
          "<div style='max-width: 500px; margin: 20px auto 0 auto; text-align: center; font-size: 11px; color: #999999; line-height: 1.4;'>" +
            "Gerado automaticamente pelo Sistema de Gestão.<br>Por favor, não respondas a este e-mail." +
          "</div>" +
        "</div>";
      
      var meuEmail = Session.getActiveUser().getEmail(); 
      var textoSimples = "Olá " + nome + ", tens aqui os detalhes da tua renovação do Spotify Premium. Abre o e-mail para veres a tabela.";
      
      GmailApp.sendEmail(email, assunto, textoSimples, {
        htmlBody: corpoDoEmail,
        bcc: meuEmail
      });
    }
  }
}

function criarFormularioMagico() {
  // 1. Cria o formulário com um nome premium
  var form = FormApp.create('💸 Registar Pagamento - Spotify');
  
  // 2. Adiciona uma descrição bacana
  form.setDescription('Usa este ecrã no telemóvel para registar rapidamente os pagamentos MB WAY que acabaram de cair. O Excel atualiza sozinho.');
  
  // 3. Cria a Pergunta 1: Quem pagou? (Lista Suspensa)
  var itemNome = form.addListItem();
  itemNome.setTitle('Quem pagou?')
          .setChoices([
            itemNome.createChoice('Membro 1'),
            itemNome.createChoice('Membro 2'),
            itemNome.createChoice('Membro 3'),
            itemNome.createChoice('Membro 4') // Depois podes ir lá editar os nomes reais
          ])
          .setRequired(true);
          
  // 4. Cria a Pergunta 2: Valor recebido
  var itemValor = form.addTextItem();
  itemValor.setTitle('Valor recebido (€)')
           .setHelpText('Exemplo: 2.90 ou 8.70 (Usa ponto em vez de vírgula)')
           .setRequired(true);
           
  // Validação para garantir que o Zé Manel só mete números e não estraga o Excel
  var validacaoNumero = FormApp.createTextValidation()
    .requireNumber()
    .setHelpText('Por favor, insere apenas o número (ex: 2.90).')
    .build();
  itemValor.setValidation(validacaoNumero);
  
  // 5. O TRUQUE MESTRE: Liga o form à tua folha de Excel atual automaticamente!
  var folhaAtual = SpreadsheetApp.getActiveSpreadsheet();
  form.setDestination(FormApp.DestinationType.SPREADSHEET, folhaAtual.getId());
  
  // Mostra-te os links no final
  console.log('✅ FORMULÁRIO CRIADO COM SUCESSO!');
  console.log('✏️ Link para tu editares: ' + form.getEditUrl());
  console.log('📱 Link para guardares no telemóvel (A "App"): ' + form.getPublishedUrl());
}

// =======================================================
// O CÉREBRO: LÊ O FORMULÁRIO, ATUALIZA EXCEL E MANDA RECIBO
// =======================================================
function processarPagamento(e) {
  // 1. Configurações
  var custoMensal = 2.90; // O valor exato de 1 mês
  var nomeAba = "Subscrições"; // O nome da tua aba principal
  
  try {
    // 2. Capturar os dados do formulário
    var nomePagador = e.namedValues['Quem pagou?'][0];
    var valorString = e.namedValues['Valor recebido (€)'][0];
    
    // Substitui vírgula por ponto para a matemática não falhar
    var valorPago = parseFloat(valorString.replace(',', '.'));
    
    // 3. A Matemática Ninja (Calcula os meses e ignora a gorjeta)
    var mesesComprados = Math.floor(valorPago / custoMensal);
    if (mesesComprados < 1) return; // Se pagou menos que 1 mês, ignora.

    // 4. Procurar o amigo na aba "Subscrições"
    var folha = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nomeAba);
    var dados = folha.getDataRange().getValues();
    
    var linhaAmigo = -1;
    var emailAmigo = "";
    var dataValidadeAtual = "";
    
    // Pesquisa linha a linha
    for (var i = 1; i < dados.length; i++) { 
      if (dados[i][0] === nomePagador) { // Coluna A (Nome)
        linhaAmigo = i + 1;
        emailAmigo = dados[i][1]; // Coluna B (Email)
        dataValidadeAtual = new Date(dados[i][3]); // Coluna E (Validade)
        break;
      }
    }
    
    if (linhaAmigo !== -1) {
      // 5. Atualizar as datas no Excel (Validade e Último Pagamento)
      var novaValidade = new Date(dataValidadeAtual);
      novaValidade.setMonth(novaValidade.getMonth() + mesesComprados);
      
      // Escreve a nova Validade na Coluna E (índice 5)
      folha.getRange(linhaAmigo, 4).setValue(novaValidade);
      
      // Escreve a Data de Hoje (sem horas) na Coluna C (Último Pagamento)
      var dataHoje = new Date();
      dataHoje.setHours(0,0,0,0);
      folha.getRange(linhaAmigo, 3).setValue(dataHoje);
      
      // 6. Preparar a data em português para o Recibo
      var mesesNomes = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
      var dataFormatada = novaValidade.getDate() + " de " + mesesNomes[novaValidade.getMonth()] + " de " + novaValidade.getFullYear();
      
      // Configurar a gramática (mês vs meses) e o valor (vírgula)
      var textoMeses = mesesComprados > 1 ? " meses" : " mês";
      var valorFormatado = valorPago.toFixed(2).replace('.', ',');
      
      // 7. Enviar o Email de Recibo (Design Gémeo Final)
      var assunto = "✅ Pagamento Confirmado: Spotify Premium";
      
      var htmlRecibo = 
        "<div style='background-color: #f4f4f5; padding: 30px 10px; font-family: \"Helvetica Neue\", Helvetica, Arial, sans-serif;'>" +
          
          "<div style='max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);'>" +
            
            "<div style='background-color: #1DB954; padding: 25px; text-align: center;'>" +
              "<img src='https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_White.png' width='130' height='auto' style='vertical-align: middle;' alt='Spotify Official Logo'>" +
            "</div>" +
            
            "<div style='padding: 30px;'>" +
              // Título MAIOR (24px)
              "<p style='font-size: 20px; color: #333333; margin-top: 0; font-weight: bold;'>Tudo certo, " + nomePagador + "! &#127911;</p>" +
              
              // Texto a 14px (igual ao Aviso) para as frases encaixarem melhor no telemóvel
              "<p style='font-size: 14px; color: #555555; line-height: 1.5; margin-bottom: 15px;'>Recebemos o teu pagamento de <b>" + valorFormatado + "€</b>.</p>" +
              "<p style='font-size: 14px; color: #555555; line-height: 1.5; margin-bottom: 25px;'>O teu Spotify Premium foi renovado por mais <b>" + mesesComprados + textoMeses + "</b> e estás oficialmente livre de preocupações.</p>" +
              
              // Caixa destaque
              "<div style='background-color: #fafafa; border: 1px solid #eeeeee; border-left: 4px solid #1DB954; border-radius: 6px; padding: 15px 20px;'>" +
                "<p style='margin: 0; font-size: 12px; color: #777777; text-transform: uppercase; letter-spacing: 1px;'>Subscrição Válida até:</p>" +
                "<p style='margin: 5px 0 0 0; font-size: 18px; font-weight: bold; color: #333333;'>" + dataFormatada + "</p>" +
              "</div>" +
              
            "</div>" +
          "</div>" +
          
          "<div style='max-width: 500px; margin: 20px auto 0 auto; text-align: center; font-size: 11px; color: #999999; line-height: 1.4;'>" +
            "Gerado automaticamente pelo Sistema de Gestão.<br>Por favor, não respondas a este e-mail." +
          "</div>" +
          
        "</div>";

      GmailApp.sendEmail(emailAmigo, assunto, "Pagamento recebido. A tua subscrição é válida até " + dataFormatada, {
        htmlBody: htmlRecibo
      });
    }
  } catch (erro) {
    console.log("Erro ao processar formulário: " + erro);
  }
}