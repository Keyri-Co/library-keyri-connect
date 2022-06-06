aws s3 sync dist s3://static.keyri.com/library-keyri-connect

aws cloudfront create-invalidation --distribution-id E40QWJD6HFBR2 --paths "/library-keyri-connect"